import type { Cart, CheckoutDraft, Product } from "../domain/types";
import type { DemoOtpService } from "../domain/demo-otp-service";
import type { DemoOrderService, DemoOrderSnapshot } from "../domain/demo-order-service";
import { mockCatalogFixture } from "../domain/mock/catalog-fixture";
import { normalizeTaiwanMobile } from "../domain/phone";
import { assessDemoAddress } from "../domain/demo-address";

type LineInput = { productId: string; variantId: string; quantity: number };
type OrderInput = {
  phone: string; challengeId: string; code: string;
  lines: LineInput[]; draft: CheckoutDraft;
};
type Dependencies = { otp: DemoOtpService; orders: DemoOrderService; reviewAddress?: (address: string) => boolean; catalogProducts?: () => Product[] };
const syntheticPhones = new Set(["0912000000", "0912000001"]);
function assertLocalDemo(): void {
  if (typeof process === "undefined" || process.release?.name !== "node" || process.env.NODE_ENV === "production"
    || process.env.DEMO_COMMERCE_LOCAL !== "enabled") {
    throw new Error("Local demo commerce is disabled");
  }
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function fields(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key));
}
function validateDraft(value: unknown, phone: string, reviewAddress?: (address: string) => boolean): void {
  if (!record(value) || !fields(value,
    ["name", "phone", "email", "deliveryMethod", "address", "paymentMethod"])) throw new Error("Invalid draft");
  if (typeof value.name !== "string" || value.name.trim().length < 1
    || value.name.length > 80 || /[\u0000-\u001f\u007f]/.test(value.name)
    || typeof value.phone !== "string" || normalizeTaiwanMobile(value.phone) !== phone) {
    throw new Error("Invalid contact");
  }
  if (value.email !== undefined && (typeof value.email !== "string"
    || value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))) {
    throw new Error("Invalid email");
  }
  if (value.deliveryMethod !== "home-delivery" && value.deliveryMethod !== "store-pickup") {
    throw new Error("Invalid delivery");
  }
  if (value.address !== undefined && typeof value.address !== "string") throw new Error("Invalid address");
  const assessment = assessDemoAddress(value.deliveryMethod, value.address as string | undefined);
  if (assessment.status === "invalid" || (assessment.status === "needs-review" && !reviewAddress?.(assessment.normalized))) {
    throw new Error("Address requires review");
  }
  if (!["bank-transfer", "cash", "phone-confirmation", "line-voice-confirmation"].includes(String(value.paymentMethod))) {
    throw new Error("Invalid traditional payment choice");
  }
}
function authoritativeCart(lines: unknown, products: Product[] = mockCatalogFixture): Cart {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 20) throw new Error("Invalid lines");
  const seen = new Set<string>();
  const cartLines: Cart["lines"] = [];
  let subtotal = 0;
  for (const item of lines) {
    if (!record(item) || !fields(item, ["productId", "variantId", "quantity"])
      || typeof item.productId !== "string" || typeof item.variantId !== "string"
      || !Number.isSafeInteger(item.quantity) || (item.quantity as number) < 1) {
      throw new Error("Invalid line");
    }
    const product = products.find(p => p.id === item.productId && p.publication === "published");
    const variant = product?.variants.find(v => v.id === item.variantId);
    if (!product || !variant || variant.inventoryStatus !== "available"
      || (item.quantity as number) > variant.maxQuantity || seen.has(variant.id)) {
      throw new Error("Unavailable line");
    }
    seen.add(variant.id);
    subtotal += variant.price.amount * (item.quantity as number);
    if (!Number.isSafeInteger(subtotal)) throw new Error("Invalid total");
    cartLines.push({
      productId: product.id, variantId: variant.id, productName: product.name,
      specification: variant.specification, unitPrice: { ...variant.price },
      quantity: item.quantity as number, inventoryStatus: variant.inventoryStatus,
      maxQuantity: variant.maxQuantity,
    });
  }
  return { lines: cartLines, subtotal: { currency: "TWD", amount: subtotal } };
}
/** Local server contract; no HTTP handlers, SMS, real payment, or merchant authorization. */
export function createLocalDemoCommerce({ otp, orders, reviewAddress, catalogProducts }: Dependencies) {
  assertLocalDemo();
  return {
    issueOtp(rawPhone: unknown) {
      assertLocalDemo();
      if (typeof rawPhone !== "string") throw new Error("Invalid phone");
      const phone = normalizeTaiwanMobile(rawPhone);
      if (!phone || !syntheticPhones.has(phone)) throw new Error("Synthetic phone required");
      return otp.issue(phone);
    },
    placeOrder(raw: unknown): { orderId: string; accessSecret: string; total: Cart["subtotal"]; notificationStatus: "simulated-queued" | "queue-failed" } {
      assertLocalDemo();
      if (!record(raw) || !fields(raw, ["phone", "challengeId", "code", "lines", "draft"])
        || typeof raw.phone !== "string" || typeof raw.challengeId !== "string"
        || typeof raw.code !== "string") {
        throw new Error("Invalid order request");
      }
      const phone = normalizeTaiwanMobile(raw.phone);
      if (!phone || !syntheticPhones.has(phone)) throw new Error("Synthetic phone required");
      const data = raw as OrderInput;
      validateDraft(data.draft, phone, reviewAddress);
      const cart = authoritativeCart(data.lines, catalogProducts?.() ?? mockCatalogFixture);
      if (!otp.verify(phone, data.challengeId, data.code)) throw new Error("OTP verification failed");
      const receipt = orders.create(cart, data.draft.paymentMethod);
      let notificationStatus: "simulated-queued" | "queue-failed" = "simulated-queued";
      try {
        orders.queueNotification(receipt.orderId, "confirmed", "customer");
        orders.queueNotification(receipt.orderId, "confirmed", "merchant");
      } catch {
        // The order already exists; preserve its access secret and report the queue failure.
        notificationStatus = "queue-failed";
      }
      return { ...receipt, total: cart.subtotal, notificationStatus };
    },
    lookup(orderId: unknown, secret: unknown): DemoOrderSnapshot | null {
      assertLocalDemo();
      if (typeof orderId !== "string" || typeof secret !== "string") return null;
      return orders.lookup(orderId, secret);
    },
  };
}
