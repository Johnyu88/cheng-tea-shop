import type { CartService } from "./cart-service";
import type { CatalogService } from "./catalog-service";
import type { CheckoutService } from "./checkout-service";
import type { ErpService } from "./erp-service";
import type { LogisticsService } from "./logistics-service";
import type { PaymentService } from "./payment-service";
import type { PublishingService } from "./publishing-service";
import type { ServiceResult } from "./result";
import type {
  ErpOrderSyncDto,
  ErpProductUpsertDto,
  ErpSyncResultDto,
  FulfillmentRequestDto,
  FulfillmentResultDto,
  PaymentRequestDto,
  PaymentResultDto,
  ShippingQuoteDto,
  ShippingQuoteRequestDto,
} from "./integration-types";
import { createMockCartService } from "./mock/mock-cart-service";
import { createMockCatalogService } from "./mock/mock-catalog-service";
import { createMockCheckoutService } from "./mock/mock-checkout-service";
import { createMockPublishingService } from "./mock/mock-publishing-service";

export type InMemoryCommerceServices = {
  catalogService: CatalogService;
  cartService: CartService;
  checkoutService: CheckoutService;
  publishingService: PublishingService;
};

export type InMemoryIntegrationAdapters = {
  paymentService: PaymentService;
  logisticsService: LogisticsService;
  erpService: ErpService;
};

export type InMemoryIntegrationAdapterOverrides = Partial<InMemoryIntegrationAdapters>;

export const createInMemoryCommerceServices = (
  overrides: Partial<InMemoryCommerceServices> = {},
): InMemoryCommerceServices => {
  const catalogService = overrides.catalogService ?? createMockCatalogService();

  return {
    catalogService,
    cartService: overrides.cartService ?? createMockCartService({ catalog: catalogService }),
    checkoutService: overrides.checkoutService ?? createMockCheckoutService(),
    publishingService: overrides.publishingService ?? createMockPublishingService(),
  };
};

export const createInMemoryPaymentService = (): PaymentService => ({
  async authorize(request: PaymentRequestDto): Promise<ServiceResult<PaymentResultDto>> {
    return { ok: true, value: { status: "simulated", reference: null, amount: request.amount } };
  },
});

export const createInMemoryLogisticsService = (): LogisticsService => ({
  async quote(request: ShippingQuoteRequestDto): Promise<ServiceResult<ShippingQuoteDto>> {
    return {
      ok: true,
      value: {
        serviceable: true,
        amount: { currency: "TWD", amount: request.deliveryMethod === "store-pickup" ? 0 : 100 },
        deliveryMethod: request.deliveryMethod,
      },
    };
  },
  async createFulfillment(request: FulfillmentRequestDto): Promise<ServiceResult<FulfillmentResultDto>> {
    return {
      ok: true,
      value: { status: "simulated", reference: `MOCK-FULFILLMENT-${request.orderReference}` },
    };
  },
});

export const createInMemoryErpService = (): ErpService => ({
  async upsertProduct(request: ErpProductUpsertDto): Promise<ServiceResult<ErpSyncResultDto>> {
    return { ok: true, value: { status: "simulated", reference: `MOCK-ERP-${request.productId}` } };
  },
  async syncOrder(request: ErpOrderSyncDto): Promise<ServiceResult<ErpSyncResultDto>> {
    return { ok: true, value: { status: "simulated", reference: `MOCK-ERP-${request.orderReference}` } };
  },
});

export const createInMemoryIntegrationAdapters = (
  overrides: InMemoryIntegrationAdapterOverrides = {},
): InMemoryIntegrationAdapters => ({
  paymentService: overrides.paymentService ?? createInMemoryPaymentService(),
  logisticsService: overrides.logisticsService ?? createInMemoryLogisticsService(),
  erpService: overrides.erpService ?? createInMemoryErpService(),
});
