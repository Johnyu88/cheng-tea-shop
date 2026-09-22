import { expect, test } from "vitest";
import { createMockCheckoutService } from "@/lib/domain/mock/mock-checkout-service";

const line = {
  productId: "tea-1",
  variantId: "tea-1-one-tael",
  productName: "陳年白茶",
  specification: "一兩",
  unitPrice: { currency: "TWD" as const, amount: 800 },
  quantity: 1,
  inventoryStatus: "available" as const,
  maxQuantity: 3,
};

const cart = { lines: [line], subtotal: { currency: "TWD" as const, amount: 800 } };
const emptyCart = { lines: [], subtotal: { currency: "TWD" as const, amount: 0 } };

const deliveryDraft = {
  name: "陳小姐",
  phone: "0912000000",
  deliveryMethod: "home-delivery" as const,
  address: "茶行路 1 號",
  paymentMethod: "credit-card" as const,
};

test("requires a non-blank name and phone", async () => {
  const service = createMockCheckoutService();

  await expect(service.validate({ ...deliveryDraft, name: "   " }, cart)).resolves.toMatchObject({
    ok: false,
    error: { code: "invalid-draft" },
  });
  await expect(service.validate({ ...deliveryDraft, phone: "  " }, cart)).resolves.toMatchObject({
    ok: false,
    error: { code: "invalid-draft" },
  });
});

test("accepts an omitted or valid optional email and rejects invalid email syntax", async () => {
  const service = createMockCheckoutService();

  await expect(service.validate(deliveryDraft, cart)).resolves.toMatchObject({ ok: true });
  await expect(service.validate({ ...deliveryDraft, email: "tea@example.tw" }, cart)).resolves.toMatchObject({ ok: true });
  await expect(service.validate({ ...deliveryDraft, email: "not-an-email" }, cart)).resolves.toMatchObject({
    ok: false,
    error: { code: "invalid-draft" },
  });
});

test("requires an address for home delivery but not store pickup", async () => {
  const service = createMockCheckoutService();

  await expect(service.validate({ ...deliveryDraft, address: " " }, cart)).resolves.toMatchObject({
    ok: false,
    error: { code: "invalid-draft" },
  });
  await expect(service.validate({
    ...deliveryDraft,
    deliveryMethod: "store-pickup",
    address: " ",
  }, cart)).resolves.toMatchObject({ ok: true });
});

test("accepts every approved payment choice for its delivery method", async () => {
  const service = createMockCheckoutService();

  for (const paymentMethod of ["credit-card", "line-pay"] as const) {
    await expect(service.validate({ ...deliveryDraft, paymentMethod }, cart)).resolves.toMatchObject({ ok: true });
  }
  for (const paymentMethod of ["credit-card", "line-pay", "pay-at-store"] as const) {
    await expect(service.validate({
      name: deliveryDraft.name,
      phone: deliveryDraft.phone,
      deliveryMethod: "store-pickup",
      paymentMethod,
    }, cart)).resolves.toMatchObject({ ok: true });
  }
});

test("rejects an empty cart with the existing cart-empty domain error", async () => {
  const service = createMockCheckoutService();

  await expect(service.validate(deliveryDraft, emptyCart)).resolves.toMatchObject({
    ok: false,
    error: { code: "cart-empty" },
  });
});

test("returns a cloned draft from validation", async () => {
  const service = createMockCheckoutService();

  const result = await service.validate(deliveryDraft, cart);

  expect(result).toMatchObject({ ok: true, value: deliveryDraft });
  if (result.ok) expect(result.value).not.toBe(deliveryDraft);
});

test("returns a deterministic confirmed receipt with the cart subtotal", async () => {
  const service = createMockCheckoutService();

  await expect(service.submit(deliveryDraft, cart)).resolves.toEqual({
    ok: true,
    value: { orderReference: "MOCK-ORDER-001", status: "confirmed", total: cart.subtotal },
  });
});

test("returns a retryable payment failure in the payment-failure scenario", async () => {
  const service = createMockCheckoutService({ scenario: "payment-failure" });

  await expect(service.submit(deliveryDraft, cart)).resolves.toMatchObject({
    ok: false,
    error: { code: "payment-failed", retryable: true },
  });
});
