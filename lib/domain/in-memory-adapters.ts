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
import { createDemoCatalogService, createDemoPublishingService } from "./demo-catalog-service";
import { confirmedTeaFixture } from "./mock/confirmed-tea-fixture";
import type { CatalogQuery, Product } from "./types";

const publicCatalog: CatalogService = {
  async listProducts(query: CatalogQuery = {}) {
    const list = confirmedTeaFixture.filter((p: Product) => p.publication === "published" && (!query.taste || p.tasteTags.includes(query.taste)) && (!query.category || p.category === query.category));
    const start = query.cursor && /^\\d+$/.test(query.cursor) ? Number(query.cursor) : 0;
    const size = Math.max(1, Math.min(50, query.limit ?? 12));
    return { ok: true as const, value: { items: list.slice(start, start + size), total: list.length, nextCursor: start + size < list.length ? String(start + size) : null } };
  },
  async getProductBySlug(slug) {
    const product = confirmedTeaFixture.find(p => p.publication === "published" && p.slug === slug);
    return product ? { ok: true as const, value: product } : { ok: false as const, error: { code: "product-not-found" as const, message: "找不到這項茶品。", retryable: false } };
  },
};


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

export const createDemoCommerceServices = (): InMemoryCommerceServices => {
  const catalogService = createDemoCatalogService();
  return {
    catalogService,
    cartService: createMockCartService({ catalog: catalogService }),
    checkoutService: createMockCheckoutService(),
    publishingService: createDemoPublishingService(),
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

export const publicTeaCatalogService: CatalogService = publicCatalog;
