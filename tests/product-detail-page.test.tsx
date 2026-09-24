import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
import type { CartService, CatalogService, Product, ProductVariant } from "@/lib/domain";
import { CommerceProvider } from "@/features/commerce/components/commerce-provider";
import { ProductDetailPage } from "@/features/product/components/product-detail-page";

const productVariant: ProductVariant = {
  id: "tea-jade-variant",
  specification: "一兩",
  price: { currency: "TWD", amount: 800 },
  inventoryStatus: "available",
  maxQuantity: 3,
};

const product: Product = {
  id: "tea-jade",
  slug: "tea-jade",
  name: "玉露清香",
  category: "green",
  tasteTags: ["light", "sweet"],
  summary: "清香柔和，入口甘甜。",
  image: { src: null, alt: "商品照片準備中", isPlaceholder: true },
  variants: [productVariant],
  publication: "published",
};

const soldOutProduct: Product = {
  ...product,
  variants: [{ ...productVariant, inventoryStatus: "sold-out" }],
};

type CatalogResponse = Awaited<ReturnType<CatalogService["getProductBySlug"]>>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function makeServices(overrides: Partial<CatalogService & CartService> = {}) {
  const catalogService: CatalogService = {
    listProducts: async () => ({ ok: true, value: { items: [], nextCursor: null, total: 0 } }),
    getProductBySlug: async () => ({ ok: true, value: product }),
    ...overrides,
  };
  const cartService: CartService = {
    getCart: async () => ({ ok: true, value: { lines: [], subtotal: { currency: "TWD", amount: 0 } } }),
    addItem: async () => ({ ok: true, value: { lines: [], subtotal: { currency: "TWD", amount: 0 } } }),
    updateQuantity: async () => ({ ok: true, value: { lines: [], subtotal: { currency: "TWD", amount: 0 } } }),
    removeItem: async () => ({ ok: true, value: { lines: [], subtotal: { currency: "TWD", amount: 0 } } }),
  };
  return { catalogService, cartService };
}

function renderPage(slug = product.slug, services = makeServices()) {
  return render(
    <CommerceProvider services={services}>
      <ProductDetailPage slug={slug} />
    </CommerceProvider>,
  );
}

it("loads product details from the catalog service", async () => {
  renderPage();

  expect(screen.getByRole("status")).toHaveTextContent("正在整理茶品資料");
  await waitFor(() => expect(screen.getByRole("heading", { name: "玉露清香" })).toBeInTheDocument());

  expect(screen.getByText("清香柔和，入口甘甜。")).toBeInTheDocument();
  expect(screen.getByText("一兩")).toBeInTheDocument();
  expect(screen.getByText("NT$800")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "商品照片準備中" })).toBeInTheDocument();
});

it("shows a not-found state for an unknown slug", async () => {
  const services = makeServices({
    getProductBySlug: async () => ({
      ok: false,
      error: { code: "product-not-found", message: "找不到這項茶品。", retryable: false },
    }),
  });
  renderPage("missing-tea", services);

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("找不到這項茶品"));
  expect(screen.getByRole("link", { name: "返回茶品目錄" })).toHaveAttribute("href", "/#catalog");
});

it("keeps the newer product when an older slug request resolves later", async () => {
  const oldRequest = deferred<CatalogResponse>();
  const newRequest = deferred<CatalogResponse>();
  const newerProduct: Product = {
    ...product,
    id: "tea-new",
    slug: "tea-new",
    name: "新茶品",
  };
  const requestedSlugs: string[] = [];
  const services = makeServices({
    getProductBySlug: async (requestedSlug) => {
      requestedSlugs.push(requestedSlug);
      return requestedSlug === "tea-old" ? oldRequest.promise : newRequest.promise;
    },
  });

  const rendered = renderPage("tea-old", services);
  await waitFor(() => expect(requestedSlugs).toEqual(["tea-old"]));

  rendered.rerender(
    <CommerceProvider services={services}>
      <ProductDetailPage slug="tea-new" />
    </CommerceProvider>,
  );
  await waitFor(() => expect(requestedSlugs).toEqual(["tea-old", "tea-new"]));

  newRequest.resolve({ ok: true, value: newerProduct });
  await waitFor(() => expect(screen.getByRole("heading", { name: "新茶品" })).toBeInTheDocument());

  await act(async () => {
    oldRequest.resolve({ ok: true, value: product });
    await oldRequest.promise;
  });

  expect(screen.getByRole("heading", { name: "新茶品" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "玉露清香" })).not.toBeInTheDocument();
});

it("retries a catalog error without losing the route", async () => {
  let attempts = 0;
  const services = makeServices({
    getProductBySlug: async () => {
      attempts += 1;
      return attempts === 1
        ? { ok: false, error: { code: "catalog-unavailable", message: "目錄暫時無法使用。", retryable: true } }
        : { ok: true, value: product };
    },
  });
  renderPage("tea-jade", services);

  await waitFor(() => expect(screen.getByRole("button", { name: "再試一次" })).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "再試一次" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "玉露清香" })).toBeInTheDocument());
  expect(attempts).toBe(2);
});

it("keeps sold-out variants visible and disables add to cart", async () => {
  const services = makeServices({ getProductBySlug: async () => ({ ok: true, value: soldOutProduct }) });
  renderPage("tea-jade", services);

  await waitFor(() => expect(screen.getByRole("heading", { name: "玉露清香" })).toBeInTheDocument());
  const addButton = screen.getByRole("button", { name: "加入購物車" });
  expect(screen.getByText("目前售完")).toBeInTheDocument();
  expect(addButton).toBeDisabled();
});

it("validates quantity and adds the selected product without resetting it", async () => {
  let added: [string, string, number] | undefined;
  const services = makeServices();
  services.cartService.addItem = async (productId, variantId, quantity) => {
    added = [productId, variantId, quantity];
    return { ok: true, value: { lines: [], subtotal: { currency: "TWD", amount: 0 } } };
  };
  renderPage("tea-jade", services);

  await waitFor(() => expect(screen.getByRole("heading", { name: "玉露清香" })).toBeInTheDocument());
  const quantity = screen.getByRole("spinbutton", { name: "購買數量" });
  fireEvent.change(quantity, { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: "加入購物車" }));
  expect(screen.getByRole("alert")).toHaveTextContent("最多購買 3 件");
  expect(added).toBeUndefined();

  fireEvent.change(quantity, { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "加入購物車" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("已加入購物車"));
  expect(added).toEqual(["tea-jade", "tea-jade-variant", 2]);
  expect(push).toHaveBeenCalledWith("/cart");
  expect(quantity).toHaveValue(2);
});

it("can adjust quantity with accessible controls and retries a cart error", async () => {
  let attempts = 0;
  const services = makeServices();
  services.cartService.addItem = async () => {
    attempts += 1;
    return attempts === 1
      ? { ok: false, error: { code: "purchase-limit-exceeded", message: "超過購買上限。", retryable: true } }
      : { ok: true, value: { lines: [], subtotal: { currency: "TWD", amount: 0 } } };
  };
  renderPage("tea-jade", services);

  await waitFor(() => expect(screen.getByRole("heading", { name: "玉露清香" })).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "增加數量" }));
  expect(screen.getByRole("spinbutton", { name: "購買數量" })).toHaveValue(2);
  fireEvent.click(screen.getByRole("button", { name: "加入購物車" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("超過購買上限"));
  fireEvent.click(screen.getByRole("button", { name: "重試加入購物車" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("已加入購物車"));
  expect(screen.getByRole("spinbutton", { name: "購買數量" })).toHaveValue(2);
});
