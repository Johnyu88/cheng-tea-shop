import { describe, expect, test } from "vitest";
import { createDemoOrderService } from "@/lib/domain/demo-order-service";
import type { Cart } from "@/lib/domain/types";
import { createSqliteDemoOrderService } from "@/lib/domain/demo-order-storage";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cart: Cart = {
  lines: [{
    productId: "tea-1", variantId: "tea-1-one-tael", productName: "陳年白茶",
    specification: "一兩", unitPrice: { currency: "TWD", amount: 800 },
    quantity: 2, inventoryStatus: "available", maxQuantity: 3,
  }],
  subtotal: { currency: "TWD", amount: 1600 },
};
describe("demo order service", () => {
  test("creates opaque unique orders with independent high entropy lookup secrets", () => {
    const service = createDemoOrderService();
    const a = service.create(cart);
    const b = service.create(cart);
    expect(a.orderId).not.toEqual(b.orderId);
    expect(a.accessSecret).not.toEqual(b.accessSecret);
    expect(a.accessSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(a.orderId).toMatch(/^DEMO-[0-9a-f-]{36}$/);
    expect(service.lookup(a.orderId, a.accessSecret)?.status).toBe("confirmed");
  });
  test("rejects an order number or phone suffix alone, invalid tokens and another order's token", () => {
    const service = createDemoOrderService();
    const a = service.create(cart);
    const b = service.create(cart);
    expect(service.lookup(a.orderId, "")).toBeNull();
    expect(service.lookup(a.orderId, "000")).toBeNull();
    expect(service.lookup(a.orderId, b.accessSecret)).toBeNull();
    expect(service.lookup("DEMO-missing", a.accessSecret)).toBeNull();
  });

  test("rotates the lookup secret, invalidates the old one, and preserves the order snapshot", () => {
    const service = createDemoOrderService();
    const original = service.create(cart);
    service.recordPackingPhoto(original.orderId, "photo-rotate-1");
    const before = service.lookup(original.orderId, original.accessSecret)!;
    const rotated = service.rotateLookupSecret(original.orderId);

    expect(rotated.accessSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(rotated.accessSecret).not.toBe(original.accessSecret);
    expect(service.lookup(original.orderId, original.accessSecret)).toBeNull();
    expect(service.lookup(original.orderId, rotated.accessSecret)).toEqual(before);
    expect(JSON.stringify(service.listInternalForMerchant())).not.toContain(rotated.accessSecret);
  });

  test("stores only product and status snapshot, never contact or payment details", () => {
    const service = createDemoOrderService();
    const mutableCart = structuredClone(cart);
    const order = service.create(mutableCart);
    mutableCart.lines[0]!.productName = "改名";
    const snapshot = service.lookup(order.orderId, order.accessSecret);
    expect(snapshot?.lines[0]?.productName).toBe("陳年白茶");
    expect(JSON.stringify(snapshot)).not.toMatch(/0912000000|tea@example.tw|茶行路|credit-card/);
    expect(snapshot?.total).toEqual({ currency: "TWD", amount: 1600 });
    if (snapshot) snapshot.lines[0]!.productName = "破壞";
    expect(service.lookup(order.orderId, order.accessSecret)?.lines[0]?.productName).toBe("陳年白茶");
  });

  test("an unpaid packed order cannot ship until simulated payment confirmation", () => {
    const service = createDemoOrderService();
    const { orderId, accessSecret } = service.create(cart);
    service.recordPackingPhoto(orderId, "photo-demo-2");
    expect(service.lookup(orderId, accessSecret)?.status).toBe("packed");
    expect(service.lookup(orderId, accessSecret)?.paymentStatus).toBe("pending");
    expect(() => service.markShipped(orderId)).toThrow();
    service.confirmSimulatedPayment(orderId);
    expect(service.lookup(orderId, accessSecret)?.paymentStatus).toBe("simulated-confirmed");
    service.markShipped(orderId);
    expect(service.lookup(orderId, accessSecret)?.status).toBe("shipped");
    expect(() => service.confirmSimulatedPayment(orderId)).toThrow();
  });

  test("requires packing photo record before shipment and keeps events in order", () => {
    const service = createDemoOrderService();
    const order = service.create(cart);
    expect(() => service.markShipped(order.orderId)).toThrow();
    service.recordPackingPhoto(order.orderId, "photo-demo-1");
    expect(service.lookup(order.orderId, order.accessSecret)?.status).toBe("packed");
    expect(service.lookup(order.orderId, order.accessSecret)?.packingPhotoId).toBe("photo-demo-1");
    service.confirmSimulatedPayment(order.orderId);
    service.markShipped(order.orderId);
    expect(service.lookup(order.orderId, order.accessSecret)?.status).toBe("shipped");
    service.markDelivered(order.orderId);
    expect(service.lookup(order.orderId, order.accessSecret)?.events.map(e => e.status))
      .toEqual(["confirmed", "packed", "shipped", "delivered"]);
  });
  test("rejects invalid photo references and repeated or regressive transitions", () => {
    const service = createDemoOrderService();
    const { orderId } = service.create(cart);
    expect(() => service.recordPackingPhoto(orderId, "https://example.test/private.jpg")).toThrow();
    expect(() => service.recordPackingPhoto(orderId, "")).toThrow();
    service.recordPackingPhoto(orderId, "photo-demo-1");
    expect(() => service.recordPackingPhoto(orderId, "photo-demo-2")).toThrow();
    service.confirmSimulatedPayment(orderId);
    service.markShipped(orderId);
    expect(() => service.markShipped(orderId)).toThrow();
  });

  test("SQLite reopening retains lookup, notifications and payment/photo shipping gates", () => {
    const dir = mkdtempSync(join(tmpdir(), "demo-orders-"));
    const path = join(dir, "orders.sqlite");
    try {
      const first = createSqliteDemoOrderService(path);
      const { orderId, accessSecret } = first.create(cart);
      first.recordPackingPhoto(orderId, "photo-demo-3");
      const note = first.queueNotification(orderId, "packed", "merchant");
      first.close();
      const second = createSqliteDemoOrderService(path);
      expect(second.lookup(orderId, accessSecret)?.packingPhotoId).toBe("photo-demo-3");
      expect(second.lookup(orderId, accessSecret)?.paymentStatus).toBe("pending");
      expect(() => second.markShipped(orderId)).toThrow();
      expect(second.queueNotification(orderId, "packed", "merchant")).toEqual(note);
      second.confirmSimulatedPayment(orderId);
      second.close();
      const third = createSqliteDemoOrderService(path);
      third.markShipped(orderId);
      expect(third.lookup(orderId, accessSecret)?.status).toBe("shipped");
      expect(third.listNotifications(orderId)).toHaveLength(1);
      third.close();
      expect(readFileSync(path).includes(Buffer.from(accessSecret))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("failed SQLite write does not leave a changed in-memory order", () => {
    const dir = mkdtempSync(join(tmpdir(), "demo-orders-"));
    try {
      const service = createSqliteDemoOrderService(join(dir, "orders.sqlite"));
      const { orderId, accessSecret } = service.create(cart);
      service.close();
      expect(() => service.recordPackingPhoto(orderId, "photo-demo-4")).toThrow();
      expect(service.lookup(orderId, accessSecret)?.status).toBe("confirmed");
      expect(service.lookup(orderId, accessSecret)?.packingPhotoId).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("failed secret rotation rolls the digest back", () => {
    let saves = 0;
    const service = createDemoOrderService({
      load: () => [],
      save: () => { saves += 1; if (saves > 1) throw new Error("simulated persistence failure"); },
    });
    const original = service.create(cart);
    expect(() => service.rotateLookupSecret(original.orderId)).toThrow("persistence failure");
    expect(service.lookup(original.orderId, original.accessSecret)?.status).toBe("confirmed");
    expect(service.listInternalForMerchant()[0]?.status).toBe("confirmed");
  });

  test("rotated secret survives SQLite reopen without changing status", () => {
    const dir = mkdtempSync(join(tmpdir(), "demo-rotate-"));
    const path = join(dir, "orders.sqlite");
    try {
      const first = createSqliteDemoOrderService(path);
      const original = first.create(cart);
      first.recordPackingPhoto(original.orderId, "photo-rotate-2");
      const rotated = first.rotateLookupSecret(original.orderId);
      first.close();
      const reopened = createSqliteDemoOrderService(path);
      expect(reopened.lookup(original.orderId, original.accessSecret)).toBeNull();
      expect(reopened.lookup(original.orderId, rotated.accessSecret)).toMatchObject({ status: "packed", packingPhotoId: "photo-rotate-2" });
      expect(reopened.listInternalForMerchant()[0]?.status).toBe("packed");
      reopened.close();
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  test("SQLite reopening refuses wrong and corrupted lookup digests", () => {
    const dir = mkdtempSync(join(tmpdir(), "demo-orders-"));
    const path = join(dir, "orders.sqlite");
    try {
      const first = createSqliteDemoOrderService(path);
      const { orderId, accessSecret } = first.create(cart);
      first.close();
      const db = new DatabaseSync(path);
      db.prepare("UPDATE demo_orders SET secret_digest = ? WHERE order_id = ?")
        .run("not-a-valid-digest", orderId);
      db.close();
      const second = createSqliteDemoOrderService(path);
      expect(second.lookup(orderId, accessSecret)).toBeNull();
      expect(second.lookup(orderId, "0".repeat(64))).toBeNull();
      second.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("queues one simulated notification per event and audience without sending externally", () => {
    const service = createDemoOrderService();
    const { orderId } = service.create(cart);
    const first = service.queueNotification(orderId, "confirmed", "customer");
    const again = service.queueNotification(orderId, "confirmed", "customer");
    const merchant = service.queueNotification(orderId, "confirmed", "merchant");
    expect(first).toEqual(again);
    expect(first).not.toEqual(merchant);
    expect(service.listNotifications(orderId)).toHaveLength(2);
    expect(service.listNotifications(orderId)[0]).toMatchObject({ delivery: "simulated", audience: "customer" });
    expect(() => service.queueNotification(orderId, "shipped", "customer")).toThrow();
  });
});

test("internal merchant list is a safe copy without lookup secrets and survives restart", () => {
  const directory = mkdtempSync(join(tmpdir(), "merchant-demo-"));
  const path = join(directory, "orders.sqlite");
  try {
    const first = createSqliteDemoOrderService(path);
    const receipt = first.create(cart);
    const listed = first.listInternalForMerchant();
    expect(listed.map(order => order.orderId)).toContain(receipt.orderId);
    expect(JSON.stringify(listed)).not.toContain(receipt.accessSecret);
    listed[0]!.lines[0]!.productName = "竄改";
    expect(first.lookup(receipt.orderId, receipt.accessSecret)?.lines[0]?.productName).toBe("陳年白茶");
    first.close();
    const reopened = createSqliteDemoOrderService(path);
    expect(reopened.listInternalForMerchant().map(order => order.orderId)).toContain(receipt.orderId);
    reopened.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
