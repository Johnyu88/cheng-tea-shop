import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CheckoutService, PaymentService, ProductDraft, PublishingService } from "@/lib/domain";
import {
  createInMemoryCommerceServices,
  createInMemoryIntegrationAdapters,
  mapAdapterError,
} from "@/lib/domain";
import { CommerceProvider, useCommerce } from "@/features/commerce/components/commerce-provider";

function UiBoundaryProbe(): React.ReactElement {
  const { catalogService, cartService, checkoutService, publishingService } = useCommerce();
  return (
    <output data-testid="ui-boundary">
      {String([catalogService, cartService, checkoutService, publishingService].every(Boolean))}
    </output>
  );
}

describe("Phase 8 integration smoke", () => {
  it("runs the default in-memory adapters across the current commerce flow", async () => {
    const commerce = createInMemoryCommerceServices();
    const integrations = createInMemoryIntegrationAdapters();
    const catalogResult = await commerce.catalogService.listProducts({ limit: 1 });

    expect(catalogResult.ok).toBe(true);
    if (!catalogResult.ok) return;
    const product = catalogResult.value.items[0];
    expect(product).toBeDefined();
    if (product === undefined) return;
    const variant = product.variants[0];
    expect(variant).toBeDefined();
    if (variant === undefined) return;

    const cartResult = await commerce.cartService.addItem(product.slug, variant.id, 1);
    expect(cartResult.ok).toBe(true);
    if (!cartResult.ok) return;

    const draft = {
      name: "陳小姐",
      phone: "0912000000",
      deliveryMethod: "store-pickup" as const,
      paymentMethod: "cash" as const,
    };
    const checkoutResult = await commerce.checkoutService.validate(draft, cartResult.value);
    expect(checkoutResult).toMatchObject({ ok: true });
    const receiptResult = await commerce.checkoutService.submit(draft, cartResult.value);
    expect(receiptResult).toMatchObject({ ok: true, value: { status: "confirmed" } });

    const paymentResult = await integrations.paymentService.authorize({
      orderReference: "MOCK-SMOKE-001",
      method: "cash",
      amount: cartResult.value.subtotal,
    });
    const shippingResult = await integrations.logisticsService.quote({
      orderReference: "MOCK-SMOKE-001",
      deliveryMethod: "store-pickup",
      destination: null,
    });
    const fulfillmentResult = await integrations.logisticsService.createFulfillment({
      orderReference: "MOCK-SMOKE-001",
      deliveryMethod: "store-pickup",
      destination: null,
    });
    const erpResult = await integrations.erpService.syncOrder({
      orderReference: "MOCK-SMOKE-001",
      total: cartResult.value.subtotal,
      lineCount: cartResult.value.lines.length,
    });
    const publishing: ProductDraft = {
      name: "本機 smoke 茶品",
      specification: "一盒",
      price: { currency: "TWD", amount: 300 },
      category: "green",
      inventoryStatus: "available",
      tasteTags: ["light"],
    };
    const publishingResult = await commerce.publishingService.saveDraft(publishing);

    expect(paymentResult).toMatchObject({ ok: true, value: { status: "simulated" } });
    expect(shippingResult).toMatchObject({ ok: true, value: { serviceable: true } });
    expect(fulfillmentResult).toMatchObject({ ok: true, value: { status: "simulated" } });
    expect(erpResult).toMatchObject({ ok: true, value: { status: "simulated" } });
    expect(publishingResult).toMatchObject({ ok: true });
  });

  it("swaps any boundary adapter without changing the UI-facing provider", () => {
    const alternateCheckout: CheckoutService = {
      validate: async (draft) => ({ ok: true, value: draft }),
      submit: async (_draft, cart) => ({
        ok: true,
        value: { orderReference: "ALTERNATE-SMOKE", status: "confirmed", total: cart.subtotal },
      }),
    };
    const alternatePayment: PaymentService = {
      authorize: async (request) => ({ ok: true, value: { status: "simulated", reference: "ALT", amount: request.amount } }),
    };
    const alternatePublishing: PublishingService = {
      saveDraft: async (draft) => ({ ok: true, value: draft }),
      publishDraft: async () => ({ ok: false, error: { code: "publishing-unavailable", message: "暫時無法發布。", retryable: true } }),
    };
    const commerce = createInMemoryCommerceServices({ checkoutService: alternateCheckout, publishingService: alternatePublishing });
    const integrations = createInMemoryIntegrationAdapters({ paymentService: alternatePayment });

    render(
      <CommerceProvider services={commerce}>
        <UiBoundaryProbe />
      </CommerceProvider>,
    );

    expect(screen.getByTestId("ui-boundary")).toHaveTextContent("true");
    expect(screen.queryByText(/mock|simulated|alternate/i)).not.toBeInTheDocument();
    expect(integrations.paymentService).toBe(alternatePayment);
    expect(commerce.checkoutService).toBe(alternateCheckout);
    expect(commerce.publishingService).toBe(alternatePublishing);
    expect(mapAdapterError({ source: "publishing", code: "unavailable", message: "暫時無法發布。", retryable: true })).toEqual({
      code: "publishing-unavailable",
      message: "暫時無法發布。",
      retryable: true,
    });
  });
});
