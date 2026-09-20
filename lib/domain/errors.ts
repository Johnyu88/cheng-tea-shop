export type DomainErrorCode =
  | "catalog-unavailable"
  | "product-not-found"
  | "cart-empty"
  | "product-sold-out"
  | "purchase-limit-exceeded"
  | "invalid-draft";

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
