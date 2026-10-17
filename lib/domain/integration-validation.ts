import { domainError } from "./errors";
import type { ServiceResult } from "./result";
import type {
  FulfillmentRequestDto,
  PaymentRequestDto,
  ShippingQuoteRequestDto,
} from "./integration-types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isMoney = (value: unknown): boolean =>
  isRecord(value) && value.currency === "TWD" && Number.isInteger(value.amount) && (value.amount as number) >= 0;

const invalid = <T>(
  code: "invalid-payment-request" | "invalid-logistics-request",
  message: string,
): ServiceResult<T> => ({ ok: false, error: domainError(code, message, false) });

const isDeliveryRequest = (value: unknown): value is ShippingQuoteRequestDto =>
  isRecord(value) &&
  typeof value.orderReference === "string" &&
  value.orderReference.trim().length > 0 &&
  (value.deliveryMethod === "home-delivery" || value.deliveryMethod === "store-pickup") &&
  (value.destination === null || typeof value.destination === "string") &&
  (value.deliveryMethod === "store-pickup" || (typeof value.destination === "string" && value.destination.trim().length > 0));

export const validatePaymentRequestDto = (value: unknown): ServiceResult<PaymentRequestDto> => {
  if (
    !isRecord(value) ||
    typeof value.orderReference !== "string" ||
    value.orderReference.trim().length === 0 ||
    (value.method !== "credit-card" && value.method !== "line-pay" && value.method !== "pay-at-store") ||
    !isMoney(value.amount)
  ) {
    return invalid("invalid-payment-request", "付款資料無效。");
  }

  return { ok: true, value: value as PaymentRequestDto };
};

export const validateShippingQuoteRequestDto = (value: unknown): ServiceResult<ShippingQuoteRequestDto> =>
  isDeliveryRequest(value)
    ? { ok: true, value }
    : invalid("invalid-logistics-request", "物流資料無效。");

export const validateFulfillmentRequestDto = (value: unknown): ServiceResult<FulfillmentRequestDto> =>
  isDeliveryRequest(value)
    ? { ok: true, value }
    : invalid("invalid-logistics-request", "物流資料無效。");
