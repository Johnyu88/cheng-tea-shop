import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import type { Cart, CartService } from "@/lib/domain";
import { CommerceProvider } from "@/features/commerce/components/commerce-provider";
import { MerchantManualCheckoutPage } from "@/features/checkout/components/merchant-manual-checkout-page";
import Page from "@/app/checkout/page";

const line = {
  productId: "tea-jade",
  variantId: "tea-jade-variant",
  productName: "玉露清香",
  specification: "一兩",
  unitPrice: { currency: "TWD" as const, amount: 800 },
  quantity: 2,
  inventoryStatus: "available" as const,
  maxQuantity: 3,
};

const cart: Cart = { lines: [line], subtotal: { currency: "TWD", amount: 1600 } };
const emptyCart: Cart = { lines: [], subtotal: { currency: "TWD", amount: 0 } };

function createCartService(overrides: Partial<CartService> = {}): CartService {
  return {
    getCart: async () => ({ ok: true, value: cart }),
    addItem: async () => ({ ok: true, value: cart }),
    updateQuantity: async () => ({ ok: true, value: cart }),
    removeItem: async () => ({ ok: true, value: cart }),
    ...overrides,
  };
}

function renderManual(cartService = createCartService()) {
  return render(
    <CommerceProvider services={{ cartService }}>
      <MerchantManualCheckoutPage />
    </CommerceProvider>,
  );
}

it("uses the manual checkout page for the formal storefront flags", () => {
  const previous = {
    publicServer: process.env.PUBLIC_STOREFRONT_SERVER,
    manual: process.env.NEXT_PUBLIC_MERCHANT_MANUAL_ORDER,
    demo: process.env.NEXT_PUBLIC_DEMO_COMMERCE,
  };
  process.env.PUBLIC_STOREFRONT_SERVER = "enabled";
  process.env.NEXT_PUBLIC_MERCHANT_MANUAL_ORDER = "enabled";
  process.env.NEXT_PUBLIC_DEMO_COMMERCE = "disabled";

  try {
    const route = Page();
    expect(route.props.children.type).toBe(MerchantManualCheckoutPage);
  } finally {
    process.env.PUBLIC_STOREFRONT_SERVER = previous.publicServer;
    process.env.NEXT_PUBLIC_MERCHANT_MANUAL_ORDER = previous.manual;
    process.env.NEXT_PUBLIC_DEMO_COMMERCE = previous.demo;
  }
});

it("shows a second confirmation and keeps the manual cart when abandonment is cancelled", async () => {
  const clearCart = vi.fn(async () => ({ ok: true as const, value: emptyCart }));
  renderManual(createCartService({ clearCart }));

  await waitFor(() => expect((screen.getByLabelText("訂購內容（可複製後貼到 LINE）") as HTMLTextAreaElement).value).toContain("玉露清香"));
  fireEvent.click(screen.getByRole("button", { name: "放棄本次購買" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("清除尚未送出的購物車與結帳草稿");
  fireEvent.click(screen.getByRole("button", { name: "繼續購買／返回填寫" }));

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect((screen.getByLabelText("訂購內容（可複製後貼到 LINE）") as HTMLTextAreaElement).value).toContain("玉露清香");
  expect(clearCart).not.toHaveBeenCalled();
});

it("clears only the unsent manual cart after abandonment is confirmed", async () => {
  const clearCart = vi.fn(async () => ({ ok: true as const, value: emptyCart }));
  renderManual(createCartService({ clearCart }));

  await waitFor(() => expect(screen.getByText("本次選購清單")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "放棄本次購買" }));
  fireEvent.click(screen.getByRole("button", { name: "確認放棄" }));

  await waitFor(() => expect(clearCart).toHaveBeenCalledTimes(1));
  expect(screen.getByText("尚未選擇茶品，也可以先聯絡陳老師詢問。")).toBeInTheDocument();
  expect(screen.queryByText("玉露清香")).not.toBeInTheDocument();
});

it("shows a failure and retains the manual cart when clearing fails", async () => {
  const clearCart = vi.fn(async () => ({ ok: false as const, error: { code: "invalid-draft" as const, message: "清除失敗", retryable: true } }));
  renderManual(createCartService({ clearCart }));

  await waitFor(() => expect(screen.getByText("本次選購清單")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "放棄本次購買" }));
  fireEvent.click(screen.getByRole("button", { name: "確認放棄" }));

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("無法清除購物車"));
  expect((screen.getByLabelText("訂購內容（可複製後貼到 LINE）") as HTMLTextAreaElement).value).toContain("玉露清香");
});

it("does not issue duplicate clear calls while abandonment is processing", async () => {
  let resolveClear!: (result: { ok: true; value: Cart }) => void;
  const clearCart = vi.fn(() => new Promise<{ ok: true; value: Cart }>((resolve) => { resolveClear = resolve; }));
  renderManual(createCartService({ clearCart }));

  await waitFor(() => expect(screen.getByText("本次選購清單")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "放棄本次購買" }));
  fireEvent.click(screen.getByRole("button", { name: "確認放棄" }));
  fireEvent.click(screen.getByRole("button", { name: "確認放棄" }));

  expect(clearCart).toHaveBeenCalledTimes(1);
  resolveClear({ ok: true, value: emptyCart });
  await waitFor(() => expect(screen.getByText("尚未選擇茶品，也可以先聯絡陳老師詢問。")).toBeInTheDocument());
});

it("renders one shared storefront header around the formal checkout route", () => {
  const route = Page();
  render(<CommerceProvider services={{ cartService: createCartService() }}>{route}</CommerceProvider>);

  expect(screen.getAllByRole("banner")).toHaveLength(1);
  expect(screen.getByRole("navigation", { name: "前台導覽" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "查看購物車" })).toHaveAttribute("href", "/cart");
});
