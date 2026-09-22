import { domainError } from "./errors";
import type { ServiceResult } from "./result";
import type { Cart, CartLine, CatalogQuery, CheckoutDraft, Money } from "./types";
import type { CheckoutRequestDto as IntegrationCheckoutRequestDto } from "./integration-types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const invalid = <T>(code: "invalid-catalog-query" | "invalid-cart" | "invalid-checkout-request", message: string): ServiceResult<T> => ({
  ok: false,
  error: domainError(code, message, false),
});

const isMoney = (value: unknown): value is Money =>
  isRecord(value) && value.currency === "TWD" && Number.isInteger(value.amount) && (value.amount as number) >= 0;

const isCartLine = (value: unknown): value is CartLine =>
  isRecord(value) &&
  typeof value.productId === "string" &&
  typeof value.variantId === "string" &&
  typeof value.productName === "string" &&
  typeof value.specification === "string" &&
  isMoney(value.unitPrice) &&
  Number.isInteger(value.quantity) &&
  (value.quantity as number) > 0 &&
  (value.inventoryStatus === "available" || value.inventoryStatus === "sold-out") &&
  Number.isInteger(value.maxQuantity) &&
  (value.maxQuantity as number) > 0;

const isCheckoutDraft = (value: unknown): value is CheckoutDraft =>
  isRecord(value) &&
  typeof value.name === "string" &&
  value.name.trim().length > 0 &&
  typeof value.phone === "string" &&
  value.phone.trim().length > 0 &&
  (value.email === undefined || typeof value.email === "string") &&
  (value.deliveryMethod === "home-delivery" || value.deliveryMethod === "store-pickup") &&
  (value.paymentMethod === "credit-card" || value.paymentMethod === "line-pay" || value.paymentMethod === "pay-at-store") &&
  (value.deliveryMethod === "store-pickup" || (typeof value.address === "string" && value.address.trim().length > 0));

export const validateCatalogQuery = (value: unknown = {}): ServiceResult<CatalogQuery> => {
  if (!isRecord(value)) return invalid("invalid-catalog-query", "目錄查詢條件無效。");
  if (value.category !== undefined && !["white", "green", "oolong", "black", "dark", "other"].includes(value.category as string)) {
    return invalid("invalid-catalog-query", "目錄查詢條件無效。");
  }
  if (value.taste !== undefined && !["light", "sweet", "rich", "roasted"].includes(value.taste as string)) {
    return invalid("invalid-catalog-query", "目錄查詢條件無效。");
  }
  if (value.cursor !== undefined && (typeof value.cursor !== "string" || !/^\d+$/.test(value.cursor))) {
    return invalid("invalid-catalog-query", "目錄查詢條件無效。");
  }
  if (value.limit !== undefined && (!Number.isInteger(value.limit) || (value.limit as number) < 1 || (value.limit as number) > 100)) {
    return invalid("invalid-catalog-query", "目錄查詢條件無效。");
  }

  return { ok: true, value: value as CatalogQuery };
};

export const validateCartDto = (value: unknown): ServiceResult<Cart> => {
  if (!isRecord(value) || !Array.isArray(value.lines) || !value.lines.every(isCartLine) || !isMoney(value.subtotal)) {
    return invalid("invalid-cart", "購物車資料無效。");
  }

  return { ok: true, value: value as Cart };
};

export const validateCheckoutRequestDto = (
  value: unknown,
): ServiceResult<IntegrationCheckoutRequestDto> => {
  if (!isRecord(value) || !isCheckoutDraft(value)) {
    return invalid("invalid-checkout-request", "結帳資料無效。");
  }
  const cartResult = validateCartDto((value as Record<string, unknown>).cart);
  if (!cartResult.ok) return invalid("invalid-checkout-request", "結帳資料無效。");

  return { ok: true, value: { draft: value as CheckoutDraft, cart: cartResult.value } };
};
