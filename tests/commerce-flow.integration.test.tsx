import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { JSX } from "react";
import type { Cart, CartService, CatalogService, CheckoutService, Product } from "@/lib/domain";
import RootLayout from "@/app/layout";
import { CommerceProvider } from "@/features/commerce/components/commerce-provider";
import { useCommerce } from "@/features/commerce/components/commerce-provider";
import { CartPage } from "@/features/cart/components/cart-page";
import { CheckoutPage } from "@/features/checkout/components/checkout-page";
import { ProductDetailPage } from "@/features/product/components/product-detail-page";

const product: Product = {
  id: "tea-jade",
  slug: "tea-jade",
  name: "玉露清香",
  category: "green",
  tasteTags: ["light", "sweet"],
  summary: "清香柔和，入口甘甜。",
  image: { src: null, alt: "商品照片準備中", isPlaceholder: true },
  variants: [{
    id: "tea-jade-variant",
    specification: "一兩",
    price: { currency: "TWD", amount: 800 },
    inventoryStatus: "available",
    maxQuantity: 3,
  }],
  publication: "published",
};
const variant = product.variants[0]!;

function CommerceProbe(): JSX.Element {
  const { catalogService, cartService } = useCommerce();
  return <output>{String(catalogService !== undefined && cartService !== undefined)}</output>;
}

function createDeterministicServices() {
  let cart: Cart = { lines: [], subtotal: { currency: "TWD", amount: 0 } };
  const catalogService: CatalogService = {
    listProducts: async () => ({ ok: true, value: { items: [product], nextCursor: null, total: 1 } }),
    getProductBySlug: async () => ({ ok: true, value: product }),
  };
  const cartService: CartService = {
    getCart: async () => ({ ok: true, value: cart }),
    addItem: async (productId, variantId, quantity) => {
      cart = {
        lines: [{
          productId,
          variantId,
          productName: product.name,
          specification: variant.specification,
          unitPrice: variant.price,
          quantity,
          inventoryStatus: "available",
          maxQuantity: 3,
        }],
        subtotal: { currency: "TWD", amount: 800 * quantity },
      };
      return { ok: true, value: cart };
    },
    updateQuantity: async () => ({ ok: true, value: cart }),
    removeItem: async () => ({ ok: true, value: { lines: [], subtotal: { currency: "TWD", amount: 0 } } }),
  };
  return { catalogService, cartService };
}

it("shares injected commerce state when route content remounts under one provider", async () => {
  const services = createDeterministicServices();
  const rendered = render(
    <CommerceProvider services={services}>
      <ProductDetailPage slug="tea-jade" />
    </CommerceProvider>,
  );

  await waitFor(() => expect(screen.getByRole("heading", { name: "玉露清香" })).toBeInTheDocument());
  fireEvent.change(screen.getByRole("spinbutton", { name: "購買數量" }), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "加入購物車" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("已加入購物車"));

  rendered.rerender(
    <CommerceProvider services={services}>
      <CartPage />
    </CommerceProvider>,
  );

  await waitFor(() => expect(screen.getByRole("heading", { name: "購物車" })).toBeInTheDocument());
  expect(screen.getByRole("spinbutton", { name: "玉露清香數量" })).toHaveValue(2);
  expect(screen.getByRole("paragraph", { name: "購物車總小計 NT$1,600" })).toBeInTheDocument();
});

it("mounts the commerce provider at the root layout", () => {
  render(
    <RootLayout>
      <CommerceProbe />
    </RootLayout>,
  );

  expect(screen.getByText("true")).toBeInTheDocument();
});

it("keeps the provider cart available when the customer moves from cart to checkout", async () => {
  const services = createDeterministicServices();
  const checkoutService: CheckoutService = {
    validate: async (draft) => ({ ok: true, value: { ...draft } }),
    submit: async (_draft, currentCart) => ({ ok: true, value: { orderReference: "MOCK-ORDER-001", status: "confirmed", total: currentCart.subtotal } }),
  };
  const rendered = render(
    <CommerceProvider services={{ ...services, checkoutService }}>
      <ProductDetailPage slug="tea-jade" />
    </CommerceProvider>,
  );

  await waitFor(() => expect(screen.getByRole("heading", { name: "玉露清香" })).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "加入購物車" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("已加入購物車"));

  rendered.rerender(
    <CommerceProvider services={{ ...services, checkoutService }}>
      <CheckoutPage />
    </CommerceProvider>,
  );

  await waitFor(() => expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument());
  expect(screen.queryByRole("heading", { name: "購物車是空的" })).toBeNull();
});
