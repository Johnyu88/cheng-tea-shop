import { join, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { createHash, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { normalizeTaiwanMobile } from "../domain/phone";
import { createDemoOtpService } from "../domain/demo-otp-service";
import { createSqliteDemoOrderService } from "../domain/demo-order-storage";
import { createLocalDemoCommerce } from "./demo-commerce";
import { readDemoCatalogProductsSync } from "./demo-catalog-store";
import { mockCatalogFixture } from "../domain/mock/catalog-fixture";
import { createSqliteDemoNotificationOutbox } from "./demo-notification-outbox";
import { createDemoMerchantWorkflow } from "./demo-merchant-workflow";
import type { CheckoutDraft, Product } from "../domain/types";

type OtpPurpose = "checkout" | "lookup";
type Options = { directory: string; otpCode?: string; catalogSeed?: Product[] };
type PlaceOrderInput = {
  phone: string;
  challengeId: string;
  code: string;
  lines: { productId: string; variantId: string; quantity: number }[];
  draft: CheckoutDraft;
};
type LookupInput = {
  orderId: string;
  accessSecret: string;
  phone: string;
  phoneLastThree: string;
  customerName?: string;
  challengeId: string;
  code: string;
};

const syntheticPhones = new Set(["0912000000", "0912000001"]);
const phoneDigest = (phone: string) => createHash("sha256").update(`local-demo-phone-v1:${phone}`).digest();
const nameDigest = (name: string) => createHash("sha256").update(`local-demo-name-v1:${name.trim().normalize("NFC")}`).digest();

/** Composes the already-hardened local services. It never contacts an external provider. */
export function createLocalDemoRuntime({ directory, otpCode = "123456", catalogSeed = mockCatalogFixture }: Options) {
  const root = resolve(directory);
  mkdirSync(root, { recursive: true });
  const orders = createSqliteDemoOrderService(join(root, "orders.sqlite"));
  const outbox = createSqliteDemoNotificationOutbox(join(root, "outbox.sqlite"), orders);
  const identities = new DatabaseSync(join(root, "identities.sqlite"));
  identities.exec("CREATE TABLE IF NOT EXISTS demo_order_identity (order_id TEXT PRIMARY KEY, phone_digest BLOB NOT NULL)");
  const columns = identities.prepare("PRAGMA table_info(demo_order_identity)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "name_digest")) identities.exec("ALTER TABLE demo_order_identity ADD COLUMN name_digest BLOB");
  const saveIdentity = identities.prepare("INSERT INTO demo_order_identity (order_id, phone_digest, name_digest) VALUES (?, ?, ?)");
  const findIdentity = identities.prepare("SELECT phone_digest, name_digest FROM demo_order_identity WHERE order_id = ?");
  const checkoutOtp = createDemoOtpService({ codeFactory: () => otpCode });
  const lookupOtp = createDemoOtpService({ codeFactory: () => otpCode });
  const commerce = createLocalDemoCommerce({
    otp: checkoutOtp,
    orders,
    catalogProducts: () => readDemoCatalogProductsSync(root, catalogSeed),
    reviewAddress: address => address === "台北市中正區測試路 1 號",
  });
  const merchant = createDemoMerchantWorkflow({
    orders,
    outbox,
    privatePhotoDirectory: join(root, "packing-photos"),
  });

  return {
    issueOtp(rawPhone: unknown, purpose: OtpPurpose) {
      if (purpose !== "checkout" && purpose !== "lookup") throw new Error("Invalid OTP purpose");
      if (typeof rawPhone !== "string") throw new Error("Synthetic phone required");
      const phone = normalizeTaiwanMobile(rawPhone);
      if (!phone || !syntheticPhones.has(phone)) throw new Error("Synthetic phone required");
      return (purpose === "checkout" ? checkoutOtp : lookupOtp).issue(phone);
    },
    placeOrder(input: PlaceOrderInput) {
      const placed = commerce.placeOrder(input);
      const normalizedPhone = normalizeTaiwanMobile(input.phone);
      if (!normalizedPhone) throw new Error("Synthetic phone required");
      saveIdentity.run(placed.orderId, phoneDigest(normalizedPhone), nameDigest(input.draft.name));
      let notificationStatus = placed.notificationStatus;
      try {
        const email = typeof input === "object" && input !== null && "draft" in input
          && typeof input.draft === "object" && input.draft !== null && "email" in input.draft
          && typeof input.draft.email === "string" && input.draft.email.trim().length > 0;
        outbox.enqueue(placed.orderId, "confirmed", "customer", email);
        outbox.enqueue(placed.orderId, "confirmed", "merchant", false);
      } catch {
        notificationStatus = "queue-failed";
      }
      return { ...placed, notificationStatus };
    },
    lookupOrder(input: LookupInput) {
      const phone = normalizeTaiwanMobile(input.phone);
      const genericFailure = () => { throw new Error("Unable to verify demo order"); };
      if (!phone || !syntheticPhones.has(phone) || !/^\d{3}$/.test(input.phoneLastThree)
        || !phone.endsWith(input.phoneLastThree)
        || !lookupOtp.verify(phone, input.challengeId, input.code)) return genericFailure();
      const order = commerce.lookup(input.orderId, input.accessSecret);
      if (!order) return genericFailure();
      if (/^[0-9]{6}-[0-9]{3,}$/.test(input.orderId) && (typeof input.customerName !== "string" || !input.customerName.trim())) return genericFailure();
      const identity = findIdentity.get(order.orderId) as { phone_digest?: Uint8Array; name_digest?: Uint8Array } | undefined;
      const storedDigest = identity?.phone_digest ? Buffer.from(identity.phone_digest) : Buffer.alloc(0);
      const suppliedDigest = phoneDigest(phone);
      if (storedDigest.length !== suppliedDigest.length || !timingSafeEqual(storedDigest, suppliedDigest)) {
        return genericFailure();
      }
      if (identity?.name_digest) {
        if (typeof input.customerName !== "string" || !input.customerName.trim()) return genericFailure();
        const expected = Buffer.from(identity.name_digest);
        const supplied = nameDigest(input.customerName);
        if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return genericFailure();
      }
      return order;
    },
    notifications(orderId: string) {
      return outbox.list(orderId);
    },
    merchant,
    outbox,
    close() {
      identities.close();
      outbox.close();
      orders.close();
    },
  };
}
