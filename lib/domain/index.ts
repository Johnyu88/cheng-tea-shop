export { mapAdapterError } from "./errors";
export type { DomainError, DomainErrorCode } from "./errors";
export {
  validateCatalogQuery,
  validateCartDto,
  validateCheckoutRequestDto,
} from "./boundary-validation";
export {
  validateFulfillmentRequestDto,
  validatePaymentRequestDto,
  validateShippingQuoteRequestDto,
} from "./integration-validation";
export {
  validateErpOrderSyncDto,
  validateErpProductUpsertDto,
  validateProductDraftDto,
} from "./publishing-erp-validation";
export type { ServiceResult } from "./result";
export type { CatalogService } from "./catalog-service";
export type { CartService } from "./cart-service";
export type { CheckoutService } from "./checkout-service";
export type { ErpService } from "./erp-service";
export type { LogisticsService } from "./logistics-service";
export type { PaymentService } from "./payment-service";
export type { PublishingService } from "./publishing-service";
export type {
  AdapterError,
  CatalogPageDto,
  CatalogProductDto,
  CartDto,
  CheckoutReceiptDto,
  CheckoutRequestDto,
  ErpOrderSyncDto,
  ErpProductUpsertDto,
  ErpSyncResultDto,
  FulfillmentRequestDto,
  FulfillmentResultDto,
  PaymentMethod,
  PaymentRequestDto,
  PaymentResultDto,
  ProductDraftDto,
  ShippingQuoteDto,
  ShippingQuoteRequestDto,
} from "./integration-types";
export type {
  Cart,
  CartLine,
  CatalogQuery,
  CheckoutDraft,
  CheckoutReceipt,
  InventoryStatus,
  Money,
  Page,
  Product,
  ProductDraft,
  ProductDraftPhoto,
  ProductId,
  ProductImage,
  ProductSlug,
  ProductVariant,
  TasteTag,
  TeaCategory,
  VariantId,
} from "./types";

export { createMockCatalogService } from "./mock/mock-catalog-service";
export { createMockCartService } from "./mock/mock-cart-service";
export { createMockCheckoutService } from "./mock/mock-checkout-service";
export { createMockPublishingService } from "./mock/mock-publishing-service";
export {
  createInMemoryCommerceServices,
  createInMemoryErpService,
  createInMemoryIntegrationAdapters,
  createInMemoryLogisticsService,
  createInMemoryPaymentService,
} from "./in-memory-adapters";
export type {
  InMemoryCommerceServices,
  InMemoryIntegrationAdapterOverrides,
  InMemoryIntegrationAdapters,
} from "./in-memory-adapters";
