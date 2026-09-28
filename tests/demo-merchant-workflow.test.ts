import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Cart } from "@/lib/domain/types";
import { createSqliteDemoOrderService } from "@/lib/domain/demo-order-storage";
import { issueDemoMerchantCookie } from "@/lib/server/demo-access";
import { createSqliteDemoNotificationOutbox } from "@/lib/server/demo-notification-outbox";
import { createDemoMerchantWorkflow, DemoMerchantNotificationError } from "@/lib/server/demo-merchant-workflow";

const cart: Cart = {
  lines: [{ productId: "tea-1", variantId: "one", productName: "茶",
    specification: "一兩", unitPrice: { currency: "TWD", amount: 300 },
    quantity: 1, inventoryStatus: "available", maxQuantity: 3 }],
  subtotal: { currency: "TWD", amount: 300 },
};
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0xff, 0xd9]);
const directories: string[] = [];
beforeEach(() => {
  process.env.DEMO_COMMERCE_LOCAL = "enabled";
  process.env.DEMO_MERCHANT_SECRET = randomBytes(32).toString("hex");
});
afterEach(() => {
  delete process.env.DEMO_COMMERCE_LOCAL;
  delete process.env.DEMO_MERCHANT_SECRET;
  for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "merchant-workflow-"));
  directories.push(directory);
  const orders = createSqliteDemoOrderService(join(directory, "orders.sqlite"));
  const outbox = createSqliteDemoNotificationOutbox(join(directory, "outbox.sqlite"), orders);
  const photoDirectory = join(directory, "photos");
  const workflow = createDemoMerchantWorkflow({ orders, outbox, privatePhotoDirectory: photoDirectory });
  const cookie = issueDemoMerchantCookie(process.env.DEMO_MERCHANT_SECRET!)!.split(";")[0]!;
  return { directory, photoDirectory, orders, outbox, workflow, cookie };
}

describe("authenticated local demo merchant workflow", () => {
  test("denies absent or altered merchant cookie and unknown orders before any mutation", async () => {
    const f = fixture();
    try {
      const { orderId } = f.orders.create(cart);
      const bad = f.cookie.slice(0, -1) + (f.cookie.endsWith("0") ? "1" : "0");
      expect(() => f.workflow.listOrders(null)).toThrow("access denied");
      expect(() => f.workflow.listOrders(bad)).toThrow("access denied");
      expect(() => f.workflow.confirmSimulatedPayment(bad, orderId)).toThrow("access denied");
      expect(() => f.workflow.markShipped(null, orderId)).toThrow("access denied");
      expect(() => f.workflow.markDelivered(bad, orderId)).toThrow("access denied");
      expect(() => f.workflow.reconcileNotifications(null, orderId, "confirmed")).toThrow("access denied");
      await expect(f.workflow.uploadPackingPhoto(null, orderId, "image/jpeg", jpeg)).rejects.toThrow("access denied");
      await expect(f.workflow.readPackingPhoto(null, orderId, "photo-missing")).rejects.toThrow("access denied");
      expect(() => f.workflow.confirmSimulatedPayment(f.cookie, "DEMO-missing")).toThrow("access denied");
      expect(f.orders.listInternalForMerchant()[0]?.paymentStatus).toBe("pending");
      expect(f.outbox.list(orderId)).toEqual([]);
    } finally { f.outbox.close(); f.orders.close(); }
  });
  test("requires explicit identity confirmation and rotates only for an authenticated merchant", () => {
    const f = fixture();
    try {
      const original = f.orders.create(cart);
      expect(() => f.workflow.rotateLookupSecret(null, original.orderId, true)).toThrow("access denied");
      expect(() => f.workflow.rotateLookupSecret(f.cookie, original.orderId, false)).toThrow("confirmation required");
      expect(f.orders.lookup(original.orderId, original.accessSecret)?.status).toBe("confirmed");

      const rotated = f.workflow.rotateLookupSecret(f.cookie, original.orderId, true);
      expect(rotated.accessSecret).toMatch(/^[0-9a-f]{64}$/);
      expect(f.orders.lookup(original.orderId, original.accessSecret)).toBeNull();
      expect(f.orders.lookup(original.orderId, rotated.accessSecret)?.status).toBe("confirmed");
      expect(JSON.stringify(f.workflow.listOrders(f.cookie))).not.toContain(rotated.accessSecret);
    } finally { f.outbox.close(); f.orders.close(); }
  });
  test("photo stays bound to its order; payment and photo gate manual shipping", async () => {
    const f = fixture();
    try {
      const { orderId, accessSecret } = f.orders.create(cart);
      const { orderId: otherId } = f.orders.create(cart);
      expect(() => f.workflow.markShipped(f.cookie, orderId)).toThrow("Unpaid");
      f.workflow.confirmSimulatedPayment(f.cookie, orderId);
      expect(() => f.workflow.markShipped(f.cookie, orderId)).toThrow("transition");
      const packed = await f.workflow.uploadPackingPhoto(f.cookie, orderId, "image/jpeg", jpeg);
      expect(packed.order.status).toBe("packed");
      expect(packed.notifications).toMatchObject([
        { status: "packed", audience: "customer", state: "queued" },
        { status: "packed", audience: "merchant", state: "queued" },
      ]);
      expect(f.orders.lookup(orderId, accessSecret)?.status).toBe("packed");
      const photoId = packed.order.packingPhotoId!;
      expect((await f.workflow.readPackingPhoto(f.cookie, orderId, photoId)).bytes).toEqual(jpeg);
      await expect(f.workflow.readPackingPhoto(f.cookie, otherId, photoId)).rejects.toThrow();
      await expect(f.workflow.uploadPackingPhoto(f.cookie, orderId, "image/jpeg", jpeg)).rejects.toThrow("transition");
      const shipped = f.workflow.markShipped(f.cookie, orderId);
      expect(shipped.order.status).toBe("shipped");
      expect(f.workflow.markDelivered(f.cookie, orderId).order.status).toBe("delivered");
      expect(() => f.workflow.markShipped(f.cookie, orderId)).toThrow();
      expect(() => f.workflow.markDelivered(f.cookie, orderId)).toThrow();
      expect(f.outbox.list(orderId)).toHaveLength(6);
      expect(JSON.stringify(f.workflow.listOrders(f.cookie))).not.toContain(accessSecret);
      expect(() => f.workflow.markShipped(f.cookie, otherId)).toThrow("Unpaid");
    } finally { f.outbox.close(); f.orders.close(); }
  });
  test("survives restart and deduplicates retries; notification failure is explicit and reconcilable", async () => {
    const f = fixture();
    let restarted: ReturnType<typeof createSqliteDemoOrderService> | null = null;
    let reopened: ReturnType<typeof createSqliteDemoNotificationOutbox> | null = null;
    try {
      const { orderId } = f.orders.create(cart);
      const broken = createDemoMerchantWorkflow({
        orders: f.orders, privatePhotoDirectory: f.photoDirectory,
        outbox: { enqueue: () => { throw new Error("simulated outbox fault"); } },
      });
      await expect(broken.uploadPackingPhoto(f.cookie, orderId, "image/jpeg", jpeg))
        .rejects.toBeInstanceOf(DemoMerchantNotificationError);
      expect(f.orders.listInternalForMerchant()[0]?.status).toBe("packed");
      expect(() => f.workflow.reconcileNotifications(f.cookie, orderId, "shipped"))
        .toThrow("has not happened");
      f.outbox.close(); f.orders.close();
      restarted = createSqliteDemoOrderService(join(f.directory, "orders.sqlite"));
      reopened = createSqliteDemoNotificationOutbox(join(f.directory, "outbox.sqlite"), restarted);
      const recovery = createDemoMerchantWorkflow({
        orders: restarted, outbox: reopened, privatePhotoDirectory: f.photoDirectory,
      });
      const photoId = recovery.listOrders(f.cookie)[0]!.packingPhotoId!;
      expect((await recovery.readPackingPhoto(f.cookie, orderId, photoId)).bytes).toEqual(jpeg);
      const first = recovery.reconcileNotifications(f.cookie, orderId, "packed");
      expect(recovery.reconcileNotifications(f.cookie, orderId, "packed").notifications).toEqual(first.notifications);
      expect(reopened.list(orderId)).toHaveLength(2);
      expect(reopened.simulateDelivery(first.notifications[0]!.id, "failure"))
        .toMatchObject({ state: "failed", lastError: "simulation-failed" });
      expect(recovery.reconcileNotifications(f.cookie, orderId, "packed").notifications[0])
        .toMatchObject({ state: "failed", lastError: "simulation-failed" });
      expect(reopened.retry(first.notifications[0]!.id).state).toBe("queued");
    } finally { reopened?.close(); restarted?.close(); }
  });
});
