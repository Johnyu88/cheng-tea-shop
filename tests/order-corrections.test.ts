import { describe, expect, test } from "vitest";
import { createDemoOrderService } from "@/lib/domain/demo-order-service";
import type { Cart } from "@/lib/domain/types";

const cart: Cart = {
  lines: [{ productId: "tea-test", variantId: "one", productName: "合成茶",
    specification: "一份", unitPrice: { currency: "TWD", amount: 100 }, quantity: 1,
    inventoryStatus: "available", maxQuantity: 3 }],
  subtotal: { currency: "TWD", amount: 100 },
};
const audit = (reason: string) => ({ actor: "authenticated-merchant", reason });

describe("order correction audit events", () => {
  test("ORDER-01 restores pending payment and keeps both operator events", () => {
    const service = createDemoOrderService();
    const { orderId, accessSecret } = service.create(cart);
    service.confirmManualPayment(orderId, audit("bank record matched"));
    service.revokeManualPayment(orderId, audit("wrong order was marked paid"));
    const customer = service.lookup(orderId, accessSecret)!;
    expect(customer.paymentStatus).toBe("pending-manual-verification");
    expect(customer.events.slice(-2)).toMatchObject([
      { action: "payment-confirmed", reason: "bank record matched", actor: "authenticated-merchant" },
      { action: "payment-revoked", reason: "wrong order was marked paid", actor: "authenticated-merchant" },
    ]);
  });

  test("ORDER-02 reopens packing, preserves prior photo event and accepts replacement", () => {
    const service = createDemoOrderService();
    const { orderId, accessSecret } = service.create(cart);
    service.recordPackingPhoto(orderId, "photo-original");
    service.reopenPacking(orderId, audit("photo was unclear"));
    expect(service.lookup(orderId, accessSecret)?.status).toBe("confirmed");
    service.recordPackingPhoto(orderId, "photo-replacement");
    const customer = service.lookup(orderId, accessSecret)!;
    expect(customer.status).toBe("packed");
    expect(customer.packingPhotoId).toBe("photo-replacement");
    expect(customer.events.slice(1)).toMatchObject([
      { action: "packed", photoId: "photo-original" },
      { action: "packing-reopened", reason: "photo was unclear" },
      { action: "packed", photoId: "photo-replacement" },
    ]);
  });

  test("ORDER-03 records each shipment issue action without rolling shipment back", () => {
    const actions = ["shipping-exception", "intercept-requested", "shipping-correction"] as const;
    for (const action of actions) {
      const service = createDemoOrderService();
      const { orderId, accessSecret } = service.create(cart);
      service.confirmManualPayment(orderId);
      service.recordPackingPhoto(orderId, "photo-packed");
      service.markShipped(orderId);
      const reason = `operator note for ${action}`;

      service.recordShippingIssue(orderId, action, audit(reason));

      const customer = service.lookup(orderId, accessSecret)!;
      expect(customer.status).toBe("shipped");
      expect(customer.shippingAttention).toMatchObject({
        action, reason, actor: "authenticated-merchant",
      });
      expect(customer.events.at(-1)).toMatchObject({
        status: "shipped", action, reason, actor: "authenticated-merchant",
      });
      expect(() => service.markShipped(orderId)).toThrow();
      expect(service.lookup(orderId, accessSecret)).toEqual(customer);
    }
  });

  test("invalid reversals fail without changing shipment or payment history", () => {
    const service = createDemoOrderService();
    const { orderId, accessSecret } = service.create(cart);
    expect(() => service.revokeManualPayment(orderId, audit("not paid"))).toThrow();
    expect(() => service.reopenPacking(orderId, audit("not packed"))).toThrow();

    service.confirmManualPayment(orderId, audit("checked"));
    service.recordPackingPhoto(orderId, "photo-packed");
    service.markShipped(orderId);
    const before = service.lookup(orderId, accessSecret)!;
    expect(() => service.revokeManualPayment(orderId, audit("after shipment"))).toThrow();
    expect(() => service.reopenPacking(orderId, audit("after shipment"))).toThrow();
    expect(() => service.markShipped(orderId)).toThrow();
    expect(service.lookup(orderId, accessSecret)).toEqual(before);

    service.markDelivered(orderId);
    const delivered = service.lookup(orderId, accessSecret)!;
    expect(() => service.markShipped(orderId)).toThrow();
    expect(() => service.reopenPacking(orderId, audit("after delivery"))).toThrow();
    expect(service.lookup(orderId, accessSecret)).toEqual(delivered);
  });
});
