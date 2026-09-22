import { describe, expect, test } from "vitest";
import type { CheckoutReceipt, ProductDraft, ProductDraftPhoto } from "@/lib/domain";
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

describe("Wave 6 domain contracts", () => {
  test("represents a confirmed TWD checkout receipt", () => {
    const receipt: CheckoutReceipt = {
      orderReference: "MOCK-ORDER-001",
      status: "confirmed",
      total: { currency: "TWD", amount: 800 },
    };

    expect(receipt).toEqual({
      orderReference: "MOCK-ORDER-001",
      status: "confirmed",
      total: { currency: "TWD", amount: 800 },
    });
  });

  test("carries up to three photo metadata entries without browser files", () => {
    const photos: ProductDraftPhoto[] = [
      { id: "front", previewUrl: "blob:front", alt: "茶葉正面" },
      { id: "side", previewUrl: "blob:side", alt: "茶葉側面" },
      { id: "package", previewUrl: "blob:package", alt: "茶葉包裝" },
    ];
    const draft: ProductDraft = {
      name: "山霧茶",
      specification: "一兩",
      price: { currency: "TWD", amount: 800 },
      category: "oolong",
      inventoryStatus: "available",
      tasteTags: ["sweet"],
      photos,
    };

    expect(draft.photos).toEqual(photos);
    expect((draft.photos ?? []).every((photo) => "previewUrl" in photo && !("file" in photo))).toBe(true);
  });

  test("allows a product draft without photo metadata", () => {
    const draft: ProductDraft = {
      name: "山霧茶",
      specification: "一兩",
      price: { currency: "TWD", amount: 800 },
      category: "oolong",
      inventoryStatus: "available",
      tasteTags: [],
    };

    expect(draft.photos).toBeUndefined();
  });
});
