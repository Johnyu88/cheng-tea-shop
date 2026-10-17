import { expect, test } from "vitest";
import { createMockCheckoutService } from "@/lib/domain/mock/mock-checkout-service";
import { createMockPublishingService } from "@/lib/domain/mock/mock-publishing-service";

const cart = {
  lines: [{
    productId: "tea-1",
    variantId: "tea-1-one-tael",
    productName: "陳年白茶",
    specification: "一兩",
    unitPrice: { currency: "TWD" as const, amount: 800 },
    quantity: 1,
    inventoryStatus: "available" as const,
    maxQuantity: 3,
  }],
  subtotal: { currency: "TWD" as const, amount: 800 },
};

test("requires a phone and rejects an incompatible home-delivery payment", async () => {
  const service = createMockCheckoutService();
  const missingPhone = await service.validate({
    name: "陳小姐",
    phone: "",
    deliveryMethod: "home-delivery",
    paymentMethod: "credit-card",
  }, cart);
  const incompatible = await service.validate({
    name: "陳小姐",
    phone: "0912000000",
    deliveryMethod: "home-delivery",
    paymentMethod: "pay-at-store",
  }, cart);
  expect(missingPhone).toMatchObject({ ok: false, error: { code: "invalid-draft" } });
  expect(incompatible).toMatchObject({ ok: false, error: { code: "invalid-draft" } });
});

test("publishes one specification from provided facts without inventing claims", async () => {
  const service = createMockPublishingService();
  const result = await service.publishDraft({
    name: "Synthetic Mountain Tea",
    specification: "一兩",
    price: { currency: "TWD", amount: 800 },
    category: "oolong",
    inventoryStatus: "available",
    tasteTags: ["sweet"],
    summary: "清甜柔順",
  }, { confirmed: true });
  expect(result).toMatchObject({ ok: true, value: { publication: "published" } });
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value.variants).toHaveLength(1);
  expect(result.value.summary).toBe("清甜柔順");
  expect(result.value.summary).not.toContain("療效");
});
