import { fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactElement } from "react";
import type { CartService, CatalogService } from "@/lib/domain";
import { CommerceProvider, useCommerce } from "@/features/commerce/components/commerce-provider";

function CommerceProbe({
  onServices,
}: {
  onServices?: (catalogService: CatalogService, cartService: CartService) => void;
}): ReactElement {
  const { catalogService, cartService } = useCommerce();
  onServices?.(catalogService, cartService);
  const [, rerender] = useState(0);
  return (
    <>
      <output data-testid="catalog-service">{String(catalogService !== undefined)}</output>
      <output data-testid="cart-service">{String(cartService !== undefined)}</output>
      <button type="button" onClick={() => rerender((value) => value + 1)}>
        重新渲染
      </button>
    </>
  );
}

it("provides one stable default service pair for the mounted tree", () => {
  const renderedServices: Array<[CatalogService, CartService]> = [];

  render(
    <CommerceProvider>
      <CommerceProbe onServices={(catalogService, cartService) => renderedServices.push([catalogService, cartService])} />
    </CommerceProvider>,
  );

  expect(screen.getByTestId("catalog-service")).toHaveTextContent("true");
  expect(screen.getByTestId("cart-service")).toHaveTextContent("true");

  fireEvent.click(screen.getByRole("button", { name: "重新渲染" }));

  expect(renderedServices.length).toBeGreaterThanOrEqual(2);
  expect(renderedServices[1][0]).toBe(renderedServices[0][0]);
  expect(renderedServices[1][1]).toBe(renderedServices[0][1]);
});

it("returns injected services unchanged", () => {
  const catalogService = {} as CatalogService;
  const cartService = {} as CartService;

  function IdentityProbe(): ReactElement {
    const services = useCommerce();
    return (
      <output data-testid="same-services">
        {String(services.catalogService === catalogService && services.cartService === cartService)}
      </output>
    );
  }

  render(
    <CommerceProvider services={{ catalogService, cartService }}>
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
