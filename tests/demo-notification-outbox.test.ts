import { describe, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Cart } from "@/lib/domain/types";
import { createDemoOrderService } from "@/lib/domain/demo-order-service";
import { createSqliteDemoNotificationOutbox } from "@/lib/server/demo-notification-outbox";

const cart: Cart = {
  lines: [{ productId: "tea-1", variantId: "one", productName: "茶",
    specification: "一兩", unitPrice: { currency: "TWD", amount: 300 },
    quantity: 1, inventoryStatus: "available", maxQuantity: 3 }],
  subtotal: { currency: "TWD", amount: 300 },
};
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "demo-outbox-"));
  return { dir, file: join(dir, "notifications.sqlite"), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}
describe("local simulated notification outbox", () => {
  test("deduplicates event plus audience across retries and restarts, with order lookup fallback", () => {
    const f = fixture();
    try {
      const orders = createDemoOrderService();
      const { orderId } = orders.create(cart);
      const first = createSqliteDemoNotificationOutbox(f.file, orders);
      const customer = first.enqueue(orderId, "confirmed", "customer");
      const merchant = first.enqueue(orderId, "confirmed", "merchant");
      expect(first.enqueue(orderId, "confirmed", "customer", true)).toEqual(customer);
      expect(customer).toMatchObject({ path: "order-lookup", state: "queued", attempts: 0 });
      expect(merchant).toMatchObject({ path: "merchant-inbox", state: "queued" });
      first.close();
      const reopened = createSqliteDemoNotificationOutbox(f.file, orders);
      expect(reopened.list(orderId)).toHaveLength(2);
      expect(reopened.enqueue(orderId, "confirmed", "merchant")).toEqual(merchant);
      expect(reopened.reconcile(orderId)).toEqual([customer, merchant]);
      reopened.close();
    } finally { f.cleanup(); }
  });
  test("simulated failure, retry, and success remain explicit across restarts", () => {
    const f = fixture();
    try {
      const orders = createDemoOrderService();
      const { orderId } = orders.create(cart);
      const first = createSqliteDemoNotificationOutbox(f.file, orders);
      const note = first.enqueue(orderId, "confirmed", "customer", true);
      expect(note.path).toBe("simulated-email");
      expect(first.simulateDelivery(note.id, "failure")).toMatchObject({
        state: "failed", attempts: 1, lastError: "simulation-failed",
      });
      expect(first.simulateDelivery(note.id, "success").state).toBe("failed");
      first.close();
      const reopened = createSqliteDemoNotificationOutbox(f.file, orders);
      expect(reopened.retry(note.id)).toMatchObject({ state: "queued", attempts: 1, lastError: null });
      expect(reopened.simulateDelivery(note.id, "success")).toMatchObject({
        state: "simulated-delivered", attempts: 2, lastError: null,
      });
      expect(reopened.simulateDelivery(note.id, "failure").attempts).toBe(2);
      expect(reopened.retry(note.id).state).toBe("simulated-delivered");
      reopened.close();
    } finally { f.cleanup(); }
  });
  test("rejects nonexistent event and reconciles a separate database write failure", () => {
    const f = fixture();
    try {
      const orders = createDemoOrderService();
      const { orderId } = orders.create(cart);
      const first = createSqliteDemoNotificationOutbox(f.file, orders);
      expect(() => first.enqueue(orderId, "packed", "customer")).toThrow("Order status has not happened");
      expect(orders.listNotifications(orderId)).toHaveLength(0);
      first.close();
      expect(() => first.enqueue(orderId, "confirmed", "customer")).toThrow();
      expect(orders.listNotifications(orderId)).toHaveLength(1);
      const reopened = createSqliteDemoNotificationOutbox(f.file, orders);
      expect(reopened.reconcile(orderId)).toMatchObject([{
        status: "confirmed", audience: "customer", path: "order-lookup", state: "queued",
      }]);
      expect(reopened.reconcile(orderId)).toHaveLength(1);
      reopened.close();
    } finally { f.cleanup(); }
  });
});
