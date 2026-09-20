import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Cart, CartService, CatalogService } from "@/lib/domain";
import { CommerceProvider } from "@/features/commerce/components/commerce-provider";
import { CartPage } from "@/features/cart/components/cart-page";

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

const populatedCart: Cart = {
  lines: [line],
  subtotal: { currency: "TWD", amount: 1600 },
};

const emptyCart: Cart = {
  lines: [],
  subtotal: { currency: "TWD", amount: 0 },
};

function makeServices(cart: Cart = populatedCart) {
  const catalogService = {} as CatalogService;
  const cartService: CartService = {
    getCart: async () => ({ ok: true, value: cart }),
    addItem: async () => ({ ok: true, value: cart }),
    updateQuantity: async () => ({ ok: true, value: cart }),
    removeItem: async () => ({ ok: true, value: emptyCart }),
  };
  return { catalogService, cartService };
}

function renderCart(services = makeServices()) {
  return render(
    <CommerceProvider services={services}>
      <CartPage />
    </CommerceProvider>,
  );
}

it("shows loading and then the empty cart state", async () => {
  let resolveCart: ((result: { ok: true; value: Cart }) => void) | undefined;
  const services = makeServices();
  services.cartService.getCart = () => new Promise((resolve) => {
    resolveCart = resolve;
  });

  renderCart(services);
  expect(screen.getByRole("status").textContent).toContain("正在整理購物車");

  resolveCart?.({ ok: true, value: emptyCart });
  await waitFor(() => expect(screen.getByRole("heading", { name: "購物車是空的" })).toBeTruthy());
  expect(screen.getByRole("link", { name: "開始選茶" }).getAttribute("href")).toBe("/#catalog");
});

it("renders populated lines and the service-provided subtotal", async () => {
  renderCart();

  await waitFor(() => expect(screen.getByRole("heading", { name: "購物車" })).toBeTruthy());
  expect(screen.getByText("玉露清香")).toBeTruthy();
  expect(screen.getByText("一兩")).toBeTruthy();
  expect(screen.getByText("NT$800")).toBeTruthy();
  expect(screen.getByText("小計：NT$1,600")).toBeTruthy();
  expect(screen.getByRole("link", { name: "繼續選茶" }).getAttribute("href")).toBe("/#catalog");
  expect((screen.getByRole("button", { name: "前往結帳" }) as HTMLButtonElement).disabled).toBe(true);
});

it("replaces the rendered line after a valid quantity update", async () => {
  const services = makeServices();
  let receivedQuantity = 0;
  services.cartService.updateQuantity = async (_productId, _variantId, quantity) => {
    receivedQuantity = quantity;
    return { ok: true, value: { ...populatedCart, lines: [{ ...line, quantity: 3 }], subtotal: { currency: "TWD", amount: 2400 } } };
  };
  renderCart(services);

  await waitFor(() => expect(screen.getByRole("heading", { name: "購物車" })).toBeTruthy());
  fireEvent.click(screen.getByRole("button", { name: "增加 玉露清香" }));

  await waitFor(() => expect((screen.getByRole("spinbutton", { name: "玉露清香數量" }) as HTMLInputElement).value).toBe("3"));
  expect(receivedQuantity).toBe(3);
  expect(screen.getByText("小計：NT$2,400")).toBeTruthy();
});

it("replaces the cart after removing a line", async () => {
  const services = makeServices();
  let receivedIds: [string, string] | undefined;
  services.cartService.removeItem = async (productId, variantId) => {
    receivedIds = [productId, variantId];
    return { ok: true, value: emptyCart };
  };
  renderCart(services);

  await waitFor(() => expect(screen.getByText("玉露清香")).toBeTruthy());
  fireEvent.click(screen.getByRole("button", { name: "移除 玉露清香" }));

  await waitFor(() => expect(screen.getByRole("heading", { name: "購物車是空的" })).toBeTruthy());
  expect(receivedIds).toEqual(["tea-jade", "tea-jade-variant"]);
});

it("preserves the current cart and exposes retryable feedback when mutations fail", async () => {
  const services = makeServices();
  services.cartService.updateQuantity = async () => ({
    ok: false,
    error: { code: "purchase-limit-exceeded", message: "超過購買上限。", retryable: true },
  });
  services.cartService.removeItem = async () => ({
    ok: false,
    error: { code: "cart-empty", message: "暫時無法移除，請再試一次。", retryable: true },
  });
  renderCart(services);

  await waitFor(() => expect(screen.getByText("玉露清香")).toBeTruthy());
  fireEvent.click(screen.getByRole("button", { name: "增加 玉露清香" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("超過購買上限"));
  expect((screen.getByRole("spinbutton", { name: "玉露清香數量" }) as HTMLInputElement).value).toBe("2");
  expect(screen.getByText("小計：NT$1,600")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "移除 玉露清香" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("暫時無法移除"));
  expect(screen.getByText("玉露清香")).toBeTruthy();
  expect((screen.getByRole("spinbutton", { name: "玉露清香數量" }) as HTMLInputElement).value).toBe("2");
});
