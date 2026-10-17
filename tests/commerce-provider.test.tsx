import { fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactElement } from "react";
import { vi } from "vitest";
import type { CartService, CatalogService, CheckoutService, PublishingService } from "@/lib/domain";
import { CommerceProvider, useCommerce } from "@/features/commerce/components/commerce-provider";

function CommerceProbe({
  onServices,
}: {
  onServices?: (
    catalogService: CatalogService,
    cartService: CartService,
    checkoutService: CheckoutService,
    publishingService: PublishingService,
  ) => void;
}): ReactElement {
  const { catalogService, cartService, checkoutService, publishingService } = useCommerce();
  onServices?.(catalogService, cartService, checkoutService, publishingService);
  const [, rerender] = useState(0);
  return (
    <>
      <output data-testid="catalog-service">{String(catalogService !== undefined)}</output>
      <output data-testid="cart-service">{String(cartService !== undefined)}</output>
      <output data-testid="checkout-service">{String(checkoutService !== undefined)}</output>
      <output data-testid="publishing-service">{String(publishingService !== undefined)}</output>
      <button type="button" onClick={() => rerender((value) => value + 1)}>
        重新渲染
      </button>
    </>
  );
}

it("provides one stable default service bundle for the mounted tree", () => {
  const renderedServices: Array<[CatalogService, CartService, CheckoutService, PublishingService]> = [];

  render(
    <CommerceProvider>
      <CommerceProbe
        onServices={(catalogService, cartService, checkoutService, publishingService) =>
          renderedServices.push([catalogService, cartService, checkoutService, publishingService])
        }
      />
    </CommerceProvider>,
  );

  expect(screen.getByTestId("catalog-service")).toHaveTextContent("true");
  expect(screen.getByTestId("cart-service")).toHaveTextContent("true");
  expect(screen.getByTestId("checkout-service")).toHaveTextContent("true");
  expect(screen.getByTestId("publishing-service")).toHaveTextContent("true");

  fireEvent.click(screen.getByRole("button", { name: "重新渲染" }));

  expect(renderedServices.length).toBeGreaterThanOrEqual(2);
  const firstServices = renderedServices[0];
  const secondServices = renderedServices[1];
  expect(firstServices).toBeDefined();
  expect(secondServices).toBeDefined();
  if (firstServices === undefined || secondServices === undefined) {
    throw new Error("Expected services to be captured for both renders");
  }
  expect(secondServices[0]).toBe(firstServices[0]);
  expect(secondServices[1]).toBe(firstServices[1]);
  expect(secondServices[2]).toBe(firstServices[2]);
  expect(secondServices[3]).toBe(firstServices[3]);
});

it("returns injected services unchanged", () => {
  const catalogService = {} as CatalogService;
  const cartService = {} as CartService;
  const checkoutService: CheckoutService = { validate: vi.fn(), submit: vi.fn() };
  const publishingService: PublishingService = {
    saveDraft: vi.fn(),
    publishDraft: vi.fn(),
  };

  function IdentityProbe(): ReactElement {
    const services = useCommerce();
    return (
      <output data-testid="same-services">
        {String(
          services.catalogService === catalogService &&
            services.cartService === cartService &&
            services.checkoutService === checkoutService &&
            services.publishingService === publishingService,
        )}
      </output>
    );
  }

  render(
    <CommerceProvider services={{ catalogService, cartService, checkoutService, publishingService }}>
      <IdentityProbe />
    </CommerceProvider>,
  );

  expect(screen.getByTestId("same-services")).toHaveTextContent("true");
});

it("throws an actionable error when used outside the provider", () => {
  expect(() => render(<CommerceProbe />)).toThrow(
    "useCommerce must be used within a CommerceProvider",
  );
});

it("persists new products through the demo catalog API when an admin build also enables the public storefront", async () => {
  vi.stubEnv("NEXT_PUBLIC_PUBLIC_STOREFRONT", "enabled");
  vi.stubEnv("NEXT_PUBLIC_DEMO_COMMERCE", "enabled");
  const created = { id: "demo-published-11", slug: "s", name: "第11樣茶", category: "black", tasteTags: [], summary: "", image: { src: null, alt: "", isPlaceholder: true }, variants: [], publication: "draft" };
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: created }), { status: 201 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: { items: [created], nextCursor: null, total: 1 } }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  let publishing: PublishingService | undefined;
  try {
    render(<CommerceProvider><CommerceProbe onServices={(_catalog, _cart, _checkout, service) => { publishing = service; }} /></CommerceProvider>);
    const result = await publishing!.saveDraft({ name: "第11樣茶", specification: "一兩", price: { currency: "TWD", amount: 888 }, category: "black", inventoryStatus: "available", tasteTags: [] });
    expect(result).toMatchObject({ ok: true, value: { id: "demo-published-11" } });
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/demo/catalog?publication=draft", expect.objectContaining({ method: "POST" }));
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  }
});

it("keeps the public storefront build away from the demo catalog write API", async () => {
  vi.stubEnv("NEXT_PUBLIC_PUBLIC_STOREFRONT", "enabled");
  vi.stubEnv("NEXT_PUBLIC_DEMO_COMMERCE", "disabled");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  let publishing: PublishingService | undefined;
  try {
    render(<CommerceProvider><CommerceProbe onServices={(_catalog, _cart, _checkout, service) => { publishing = service; }} /></CommerceProvider>);
    await publishing!.saveDraft({ name: "測試", specification: "一兩", price: { currency: "TWD", amount: 1 }, category: "black", inventoryStatus: "available", tasteTags: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  }
});
