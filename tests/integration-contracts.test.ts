import { describe, expect, it } from "vitest";
import type {
  CatalogProductDto,
  ErpOrderSyncDto,
  FulfillmentRequestDto,
  PaymentRequestDto,
  ShippingQuoteRequestDto,
} from "@/lib/domain";
import {
  createInMemoryCommerceServices,
  createInMemoryErpService,
  createInMemoryIntegrationAdapters,
  createInMemoryLogisticsService,
  createInMemoryPaymentService,
  mapAdapterError,
  type CatalogService,
  type ErpService,
  type LogisticsService,
  type PaymentService,
} from "@/lib/domain";

describe("Phase 8 integration contracts", () => {
  it("defines DTOs without accepting raw payment credentials", () => {
    const paymentRequest: PaymentRequestDto = {
      orderReference: "ORDER-MOCK-001",
      method: "pay-at-store",
      amount: { currency: "TWD", amount: 680 },
    };
    const catalogProduct: CatalogProductDto = {
      id: "product-1",
      slug: "spring-tea",
      name: "春茶",
      category: "green",
      tasteTags: ["light"],
      summary: "清爽茶款",
      image: { src: null, alt: "春茶商品圖預留位置", isPlaceholder: true },
      variants: [],
      publication: "published",
    };

    expect(paymentRequest).not.toHaveProperty("cardNumber");
    expect(paymentRequest).not.toHaveProperty("securityCode");
    expect(paymentRequest).not.toHaveProperty("token");
    expect(catalogProduct.publication).toBe("published");
  });

  it("maps adapter errors to stable domain errors", () => {
    expect(
      mapAdapterError({
        source: "payment",
        code: "provider-timeout",
        message: "付款服務暫時無法使用",
        retryable: true,
      }),
    ).toEqual({
      code: "payment-unavailable",
      message: "付款服務暫時無法使用",
      retryable: true,
    });
    expect(
      mapAdapterError({
        source: "logistics",
        code: "not-serviceable",
        message: "配送服務暫時無法使用",
        retryable: false,
      }).code,
    ).toBe("logistics-unavailable");
    expect(
      mapAdapterError({
        source: "erp",
        code: "sync-failed",
        message: "ERP 同步服務暫時無法使用",
        retryable: true,
      }).code,
    ).toBe("erp-unavailable");
  });

  it("provides local fake payment, logistics, and ERP adapters", async () => {
    const paymentRequest: PaymentRequestDto = {
      orderReference: "ORDER-MOCK-002",
      method: "pay-at-store",
      amount: { currency: "TWD", amount: 420 },
    };
    const shippingRequest: ShippingQuoteRequestDto = {
      orderReference: "ORDER-MOCK-002",
      deliveryMethod: "store-pickup",
      destination: null,
    };
    const fulfillmentRequest: FulfillmentRequestDto = {
      orderReference: "ORDER-MOCK-002",
      deliveryMethod: "store-pickup",
      destination: null,
    };
    const erpRequest: ErpOrderSyncDto = {
      orderReference: "ORDER-MOCK-002",
      total: paymentRequest.amount,
      lineCount: 1,
    };

    const paymentResult = await createInMemoryPaymentService().authorize(paymentRequest);
    const logistics = createInMemoryLogisticsService();
    const quoteResult = await logistics.quote(shippingRequest);
    const fulfillmentResult = await logistics.createFulfillment(fulfillmentRequest);
    const erpResult = await createInMemoryErpService().syncOrder(erpRequest);

    expect(paymentResult).toEqual({
      ok: true,
      value: { status: "simulated", reference: null, amount: paymentRequest.amount },
    });
    expect(quoteResult.ok).toBe(true);
    expect(fulfillmentResult).toMatchObject({ ok: true });
    expect(erpResult).toMatchObject({
      ok: true,
      value: { status: "simulated", reference: "MOCK-ERP-ORDER-MOCK-002" },
    });
  });

  it("supports swapping the catalog adapter without changing the service contract", () => {
    const alternateCatalog: CatalogService = {
      listProducts: async () => ({ ok: true, value: { items: [], nextCursor: null, total: 0 } }),
      getProductBySlug: async () => ({
        ok: false,
        error: { code: "product-not-found", message: "找不到商品", retryable: false },
      }),
    };
    const services = createInMemoryCommerceServices({ catalogService: alternateCatalog });

    expect(services.catalogService).toBe(alternateCatalog);
    expect(services.cartService).toBeDefined();
  });

  it("keeps adapter interfaces replaceable independently", () => {
    const payment: PaymentService = createInMemoryPaymentService();
    const logistics: LogisticsService = createInMemoryLogisticsService();
    const erp: ErpService = createInMemoryErpService();

    expect(payment.authorize).toBeTypeOf("function");
    expect(logistics.quote).toBeTypeOf("function");
    expect(logistics.createFulfillment).toBeTypeOf("function");
    expect(erp.syncOrder).toBeTypeOf("function");
    expect(erp.upsertProduct).toBeTypeOf("function");
  });

  it("can replace the external-integration boundary as one local bundle", () => {
    const adapters = createInMemoryIntegrationAdapters();

    expect(adapters.paymentService).toBeDefined();
    expect(adapters.logisticsService).toBeDefined();
    expect(adapters.erpService).toBeDefined();
  });
});
