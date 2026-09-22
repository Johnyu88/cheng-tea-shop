import type { AdapterError } from "./integration-types";

export type DomainErrorCode =
  | "catalog-unavailable"
  | "product-not-found"
  | "cart-empty"
  | "product-sold-out"
  | "purchase-limit-exceeded"
  | "invalid-draft"
  | "payment-failed"
  | "payment-unavailable"
  | "logistics-unavailable"
  | "erp-unavailable"
  | "adapter-invalid-response"
  | "checkout-unavailable"
  | "publishing-unavailable";

export type DomainError = {
  code: DomainErrorCode;
  message: string;
  retryable: boolean;
};

export const domainError = (
  code: DomainErrorCode,
  message: string,
  retryable: boolean,
): DomainError => ({ code, message, retryable });

export const mapAdapterError = (error: AdapterError): DomainError => {
  const codeBySource = {
    payment: "payment-unavailable",
    logistics: "logistics-unavailable",
    erp: "erp-unavailable",
  } as const;

  return domainError(codeBySource[error.source], error.message, error.retryable);
};
