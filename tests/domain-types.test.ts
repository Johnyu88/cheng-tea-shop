import { describe, expect, test } from "vitest";
import { assertValidMoney, isValidQuantity } from "@/lib/domain/validation";

describe("domain value validation", () => {
  test("accepts integer non-negative TWD", () => {
    expect(assertValidMoney({ currency: "TWD", amount: 800 })).toEqual({
      ok: true,
      value: { currency: "TWD", amount: 800 },
    });
  });

  test("rejects fractional, negative, and non-finite TWD", () => {
    expect(assertValidMoney({ currency: "TWD", amount: 800.5 }).ok).toBe(false);
    expect(assertValidMoney({ currency: "TWD", amount: -1 }).ok).toBe(false);
    expect(assertValidMoney({ currency: "TWD", amount: Number.NaN }).ok).toBe(false);
  });

  test("accepts only positive integer quantities", () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
  });
});
