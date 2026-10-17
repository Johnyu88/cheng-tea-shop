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
  validateCatalogQuery,
  validateCartDto,
  validateCheckoutRequestDto,
  validateFulfillmentRequestDto,
  validateErpOrderSyncDto,
  validateErpProductUpsertDto,
  validatePaymentRequestDto,
  validateProductDraftDto,
  validateShippingQuoteRequestDto,
  type CatalogService,
  type CheckoutService,
  type ErpService,
  type LogisticsService,
  type PaymentService,
  type PublishingService,
  type Product,
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
    expect(
      mapAdapterError({
        source: "publishing",
        code: "cms-timeout",
        message: "發布服務暫時無法使用",
        retryable: true,
      }).code,
    ).toBe("publishing-unavailable");
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

  it("validates Payment and Logistics DTOs before an adapter call", () => {
    expect(
      validatePaymentRequestDto({
        orderReference: "ORDER-MOCK-003",
        method: "pay-at-store",
        amount: { currency: "USD", amount: 100 },
      }),
    ).toEqual({
      ok: false,
      error: { code: "invalid-payment-request", message: "付款資料無效。", retryable: false },
    });
    expect(
      validateShippingQuoteRequestDto({
        orderReference: "ORDER-MOCK-003",
        deliveryMethod: "home-delivery",
        destination: null,
      }),
    ).toEqual({
      ok: false,
      error: { code: "invalid-logistics-request", message: "物流資料無效。", retryable: false },
    });
    expect(
      validateFulfillmentRequestDto({
        orderReference: "ORDER-MOCK-003",
        deliveryMethod: "store-pickup",
        destination: null,
      }),
    ).toMatchObject({ ok: true });
  });

  it("swaps Payment and Logistics adapters at the integration boundary", () => {
    const alternatePayment: PaymentService = {
      authorize: async (request) => ({ ok: true, value: { status: "simulated", reference: "ALT-PAYMENT", amount: request.amount } }),
    };
    const alternateLogistics: LogisticsService = {
      quote: async (request) => ({
        ok: true,
        value: { serviceable: false, amount: { currency: "TWD", amount: 0 }, deliveryMethod: request.deliveryMethod },
      }),
      createFulfillment: async () => ({ ok: true, value: { status: "unavailable", reference: null } }),
    };
    const adapters = createInMemoryIntegrationAdapters({
      paymentService: alternatePayment,
      logisticsService: alternateLogistics,
    });

    expect(adapters.paymentService).toBe(alternatePayment);
    expect(adapters.logisticsService).toBe(alternateLogistics);
  });

  it("validates Publishing and ERP DTOs with the same boundary error shape", () => {
    expect(validateProductDraftDto({ name: "", specification: "一盒" })).toEqual({
      ok: false,
      error: { code: "invalid-publishing-request", message: "商品草稿資料無效。", retryable: false },
    });
    expect(validateErpProductUpsertDto({ productId: "", name: "茶", publication: "published" })).toEqual({
      ok: false,
      error: { code: "invalid-erp-request", message: "ERP 資料無效。", retryable: false },
    });
    expect(validateErpOrderSyncDto({ orderReference: "ORDER-MOCK-004", total: { currency: "TWD", amount: 100 }, lineCount: 0 })).toEqual({
      ok: false,
      error: { code: "invalid-erp-request", message: "ERP 資料無效。", retryable: false },
    });
  });

  it("swaps Publishing and ERP adapters independently", () => {
    const alternatePublishing: PublishingService = {
      generateSummary: async () => ({ ok: true, value: "替換摘要" }),
      saveDraft: async (draft) => ({ ok: true, value: draft }),
      publishDraft: async (draft) => ({
        ok: true,
        value: {
          id: "alternate-published",
          slug: "alternate-published",
          name: draft.name,
          category: draft.category,
          tasteTags: [...draft.tasteTags],
          summary: draft.summary ?? "",
          image: { src: null, alt: "替換商品", isPlaceholder: true },
          variants: [],
          publication: "published",
        },
      }),
    };
    const alternateErp: ErpService = {
      upsertProduct: async () => ({ ok: true, value: { status: "simulated", reference: "ALT-ERP-PRODUCT" } }),
      syncOrder: async () => ({ ok: true, value: { status: "simulated", reference: "ALT-ERP-ORDER" } }),
    };
    const commerce = createInMemoryCommerceServices({ publishingService: alternatePublishing });
    const adapters = createInMemoryIntegrationAdapters({ erpService: alternateErp });

    expect(commerce.publishingService).toBe(alternatePublishing);
    expect(adapters.erpService).toBe(alternateErp);
  });

  it("keeps all local service failures on the same ServiceResult error contract", () => {
    const errors = [
      validatePaymentRequestDto({}),
      validateShippingQuoteRequestDto({}),
      validateProductDraftDto({}),
      validateErpOrderSyncDto({}),
    ];

    for (const result of errors) {
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(Object.keys(result.error).sort()).toEqual(["code", "message", "retryable"]);
        expect(result.error.retryable).toBe(false);
      }
    }
  });

  it("validates Catalog, Cart, and Checkout DTO boundaries with stable errors", () => {
    expect(validateCatalogQuery({ limit: 0 })).toEqual({
      ok: false,
      error: { code: "invalid-catalog-query", message: "目錄查詢條件無效。", retryable: false },
    });
    expect(validateCartDto({ lines: [], subtotal: { currency: "USD", amount: 0 } })).toEqual({
      ok: false,
      error: { code: "invalid-cart", message: "購物車資料無效。", retryable: false },
    });
    expect(validateCheckoutRequestDto({ draft: {}, cart: {} })).toEqual({
      ok: false,
      error: { code: "invalid-checkout-request", message: "結帳資料無效。", retryable: false },
    });
  });

  it("keeps Cart coupled to the injected Catalog adapter, not a concrete mock", async () => {
    const product: Product = {
      id: "alternate-product",
      slug: "alternate-product",
      name: "替換目錄茶品",
      category: "green" as const,
      tasteTags: ["light"],
      summary: "契約測試商品",
      image: { src: null, alt: "替換目錄茶品圖示", isPlaceholder: true },
      variants: [
        {
          id: "alternate-variant",
          specification: "一盒",
          price: { currency: "TWD" as const, amount: 360 },
          inventoryStatus: "available" as const,
          maxQuantity: 2,
        },
      ],
      publication: "published" as const,
    };
    const alternateCatalog: CatalogService = {
      listProducts: async () => ({ ok: true, value: { items: [product], nextCursor: null, total: 1 } }),
      getProductBySlug: async () => ({ ok: true, value: product }),
    };
    const services = createInMemoryCommerceServices({ catalogService: alternateCatalog });

    const result = await services.cartService.addItem("alternate-product", "alternate-variant", 1);

    expect(result).toMatchObject({ ok: true, value: { lines: [{ productName: "替換目錄茶品" }] } });
  });

  it("swaps Checkout independently while preserving the commerce bundle boundary", () => {
    const alternateCheckout: CheckoutService = {
      validate: async (draft) => ({ ok: true, value: draft }),
      submit: async (_draft, cart) => ({
        ok: true,
        value: { orderReference: "ALTERNATE-ORDER", status: "confirmed", total: cart.subtotal },
      }),
    };
    const services = createInMemoryCommerceServices({ checkoutService: alternateCheckout });

    expect(services.checkoutService).toBe(alternateCheckout);
  });
});
