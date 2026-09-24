import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
import { useState, type JSX, type MouseEvent } from "react";
import type { Cart, CartService, CatalogService, CheckoutService, Product } from "@/lib/domain";
import { createMockCheckoutService } from "@/lib/domain";
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

function CheckoutRouteHarness(): JSX.Element {
  const [route, setRoute] = useState<"product" | "cart" | "checkout">("product");
  const navigate = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest("a");
    const href = link?.getAttribute("href");
    if (href !== "/cart" && href !== "/checkout") return;
    event.preventDefault();
    setRoute(href === "/cart" ? "cart" : "checkout");
  };

  return (
    <div onClickCapture={navigate}>
      {route === "product" && <ProductDetailPage slug="tea-jade" />}
      {route === "cart" && <CartPage />}
      {route === "checkout" && <CheckoutPage />}
    </div>
  );
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

it("recovers a delayed provider checkout failure across the cart-to-checkout boundary without duplicate submission", async () => {
  const services = createDeterministicServices();
  const defaultCheckoutService = createMockCheckoutService();
  const submittedDrafts: Parameters<CheckoutService["submit"]>[0][] = [];
  let submitCalls = 0;
  let resolveFirstSubmit: ((result: Awaited<ReturnType<CheckoutService["submit"]>>) => void) | undefined;
  const checkoutService: CheckoutService = {
    validate: (draft, currentCart) => defaultCheckoutService.validate(draft, currentCart),
    submit: (draft, currentCart) => {
      submitCalls += 1;
      submittedDrafts.push({ ...draft });
      if (submitCalls === 1) {
        return new Promise((resolve) => { resolveFirstSubmit = resolve; });
      }
      return defaultCheckoutService.submit(draft, currentCart);
    },
  };
  render(
    <CommerceProvider services={{ ...services, checkoutService }}>
      <CheckoutRouteHarness />
    </CommerceProvider>,
  );

  await waitFor(() => expect(screen.getByRole("heading", { name: "玉露清香" })).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "加入購物車" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("已加入購物車"));
  fireEvent.click(screen.getByRole("link", { name: "查看購物車" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "購物車" })).toBeInTheDocument());
  fireEvent.click(screen.getByRole("link", { name: "前往結帳" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("姓名"), { target: { value: "陳小姐" } });
  fireEvent.change(screen.getByLabelText("手機號碼"), { target: { value: "0912000000" } });
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  fireEvent.change(screen.getByLabelText("宅配地址"), { target: { value: "茶行路 1 號" } });
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));

  const submit = screen.getByRole("button", { name: "送出訂單" });
  fireEvent.click(submit);
  fireEvent.click(submit);
  await waitFor(() => expect(screen.getByRole("button", { name: "處理中" })).toBeDisabled());
  expect(submitCalls).toBe(1);

  await act(async () => {
    resolveFirstSubmit?.({ ok: false, error: { code: "payment-failed", message: "付款未完成，請再試一次。", retryable: true } });
  });
  expect(screen.getByRole("alert")).toHaveTextContent("付款未完成");
  expect(screen.getByText("宅配至 茶行路 1 號")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "再試一次" }));
  await waitFor(() => expect(screen.getByText("訂單編號：MOCK-ORDER-001")).toBeInTheDocument());
  expect(submitCalls).toBe(2);
  expect(submittedDrafts[1]).toMatchObject({
    name: "陳小姐",
    phone: "0912000000",
    address: "茶行路 1 號",
  });
  expect(submittedDrafts[1]).not.toHaveProperty("email");
});
