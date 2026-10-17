import { expect, test } from "vitest";
import { createMockCartService } from "@/lib/domain/mock/mock-cart-service";

test("adds an available item and calculates an integer TWD subtotal", async () => {
  const service = createMockCartService();
  const result = await service.addItem("mock-tea-001", "mock-tea-001-variant", 2);
  expect(result).toMatchObject({ ok: true, value: { subtotal: { currency: "TWD" } } });
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value.subtotal.amount % 1).toBe(0);
  expect(result.value.lines[0]?.quantity).toBe(2);
  expect(result.value.lines[0]?.inventoryStatus).toBe("available");
});

test("honors a sold-out catalog variant in the default cart service", async () => {
  const service = createMockCartService();
  const result = await service.addItem("mock-tea-048", "mock-tea-048-variant", 1);

  expect(result).toMatchObject({ ok: false, error: { code: "product-sold-out" } });
  expect(await service.getCart()).toEqual({
    ok: true,
    value: { lines: [], subtotal: { currency: "TWD", amount: 0 } },
  });
});

test("rejects sold-out items and preserves the existing cart", async () => {
  const service = createMockCartService({ scenario: "sold-out" });
  const before = await service.getCart();
  const result = await service.addItem("mock-tea-001", "mock-tea-001-variant", 1);
  expect(result).toMatchObject({ ok: false, error: { code: "product-sold-out" } });
  expect(await service.getCart()).toEqual(before);
});

test("rejects a quantity above the purchase limit without discarding valid lines", async () => {
  const service = createMockCartService({ scenario: "purchase-limit" });
  const added = await service.addItem("mock-tea-001", "mock-tea-001-variant", 1);
  expect(added.ok).toBe(true);
  const rejected = await service.updateQuantity("mock-tea-001", "mock-tea-001-variant", 99);
  expect(rejected).toMatchObject({ ok: false, error: { code: "purchase-limit-exceeded" } });
  const current = await service.getCart();
  expect(current).toMatchObject({ ok: true, value: { lines: [{ quantity: 1 }] } });
});
