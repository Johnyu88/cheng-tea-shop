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

  test("ORDER-03 records exception/intercept without pretending shipment was rolled back", () => {
    const service = createDemoOrderService();
    const { orderId, accessSecret } = service.create(cart);
    service.confirmManualPayment(orderId);
    service.recordPackingPhoto(orderId, "photo-packed");
    service.markShipped(orderId);
    service.recordShippingIssue(orderId, "intercept-requested", audit("customer requested cancellation"));
    const customer = service.lookup(orderId, accessSecret)!;
    expect(customer.status).toBe("shipped");
    expect(customer.shippingAttention).toMatchObject({
      action: "intercept-requested", reason: "customer requested cancellation",
      actor: "authenticated-merchant",
    });
    expect(customer.events.at(-1)).toMatchObject({ status: "shipped", action: "intercept-requested" });
    expect(() => service.markShipped(orderId)).toThrow();
  });
});
