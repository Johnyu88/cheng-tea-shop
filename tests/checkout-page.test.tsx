import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Cart, CartService, CheckoutService } from "@/lib/domain";
import { CommerceProvider } from "@/features/commerce/components/commerce-provider";
import { CheckoutPage } from "@/features/checkout/components/checkout-page";

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

const cart: Cart = {
  lines: [line],
  subtotal: { currency: "TWD", amount: 1600 },
};

const emptyCart: Cart = {
  lines: [],
  subtotal: { currency: "TWD", amount: 0 },
};

const validDraft = {
  name: "陳小姐",
  phone: "0912000000",
  email: "tea@example.tw",
  deliveryMethod: "home-delivery" as const,
  address: "茶行路 1 號",
  paymentMethod: "credit-card" as const,
};

function createCartService(currentCart: Cart = cart): CartService {
  return {
    getCart: async () => ({ ok: true, value: currentCart }),
    addItem: async () => ({ ok: true, value: currentCart }),
    updateQuantity: async () => ({ ok: true, value: currentCart }),
    removeItem: async () => ({ ok: true, value: currentCart }),
  };
}

function createCheckoutService(overrides: Partial<CheckoutService> = {}): CheckoutService {
  return {
    validate: async (draft) => ({ ok: true, value: { ...draft } }),
    submit: async () => ({ ok: true, value: { orderReference: "MOCK-ORDER-001", status: "confirmed", total: cart.subtotal } }),
    ...overrides,
  };
}

function renderCheckout(options: { currentCart?: Cart; checkoutService?: CheckoutService } = {}) {
  const services = {
    cartService: createCartService(options.currentCart),
    ...(options.checkoutService === undefined ? {} : { checkoutService: options.checkoutService }),
  };

  return render(
    <CommerceProvider services={services}>
      <CheckoutPage />
    </CommerceProvider>,
  );
}

async function reachReview(email: string | null = validDraft.email) {
  await waitFor(() => expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("姓名"), { target: { value: validDraft.name } });
  fireEvent.change(screen.getByLabelText("手機號碼"), { target: { value: validDraft.phone } });
  if (email !== null) fireEvent.change(screen.getByLabelText("Email（選填）"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "配送方式" })).toBeInTheDocument());
  fireEvent.click(screen.getByLabelText("宅配"));
  fireEvent.change(screen.getByLabelText("宅配地址"), { target: { value: validDraft.address } });
  fireEvent.click(screen.getByLabelText("信用卡"));
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "確認訂單" })).toBeInTheDocument());
}

it("submits through the real default checkout service when optional email is omitted", async () => {
  renderCheckout();
  await reachReview(null);

  fireEvent.click(screen.getByRole("button", { name: "送出訂單" }));

  await waitFor(() => expect(screen.getByText("訂單編號：MOCK-ORDER-001")).toBeInTheDocument());
});

it("moves focus to each newly displayed step heading", async () => {
  renderCheckout();
  await waitFor(() => expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("姓名"), { target: { value: validDraft.name } });
  fireEvent.change(screen.getByLabelText("手機號碼"), { target: { value: validDraft.phone } });

  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "配送方式" })).toHaveFocus());
  fireEvent.change(screen.getByLabelText("宅配地址"), { target: { value: validDraft.address } });
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));

  await waitFor(() => expect(screen.getByRole("heading", { name: "確認訂單" })).toHaveFocus());
});

it("guides an empty cart back to the cart", async () => {
  renderCheckout({ currentCart: emptyCart });

  await waitFor(() => expect(screen.getByRole("heading", { name: "購物車是空的" })).toBeInTheDocument());
  expect(screen.getByRole("link", { name: "查看購物車" })).toHaveAttribute("href", "/cart");
});

it("labels checkout as a synthetic prototype without real payment or persistence", async () => {
  renderCheckout();

  await waitFor(() => expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument());
  expect(screen.getByText("此頁為合成展示／原型，不會送出真實付款，也不會保存付款資料。")).toBeInTheDocument();
});

it("keeps the prototype boundary visible after synthetic checkout success", async () => {
  renderCheckout();
  await reachReview(null);

  fireEvent.click(screen.getByRole("button", { name: "送出訂單" }));

  await waitFor(() => expect(screen.getByText("訂單編號：MOCK-ORDER-001")).toBeInTheDocument());
  expect(screen.getByText("此頁為合成展示／原型，不會送出真實付款，也不會保存付款資料。")).toBeInTheDocument();
});

it("requires a phone number before contact can advance", async () => {
  renderCheckout();

  await waitFor(() => expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));

  expect(screen.getByRole("alert")).toHaveTextContent("請填寫手機號碼");
  expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument();
});

it("requires a name before contact can advance", async () => {
  renderCheckout();

  await waitFor(() => expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("手機號碼"), { target: { value: validDraft.phone } });
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));

  expect(screen.getByRole("alert")).toHaveTextContent("請填寫姓名");
  expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument();
});

it("moves through contact, delivery, and review steps", async () => {
  renderCheckout();

  await reachReview();

  expect(screen.getByText("玉露清香")).toBeInTheDocument();
  expect(screen.getByText("小計：NT$1,600")).toBeInTheDocument();
});

it("requires an address for home delivery", async () => {
  renderCheckout();
  await waitFor(() => expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("姓名"), { target: { value: validDraft.name } });
  fireEvent.change(screen.getByLabelText("手機號碼"), { target: { value: validDraft.phone } });
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "配送方式" })).toBeInTheDocument());
  fireEvent.click(screen.getByLabelText("宅配"));
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));

  expect(screen.getByRole("alert")).toHaveTextContent("宅配請填寫地址");
});

it("shows payment choices that match the selected delivery", async () => {
  renderCheckout();
  await waitFor(() => expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("姓名"), { target: { value: validDraft.name } });
  fireEvent.change(screen.getByLabelText("手機號碼"), { target: { value: validDraft.phone } });
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "配送方式" })).toBeInTheDocument());

  expect(screen.getByLabelText("信用卡")).toBeInTheDocument();
  expect(screen.getByLabelText("LINE Pay")).toBeInTheDocument();
  expect(screen.queryByLabelText("到店付款")).toBeNull();
  fireEvent.click(screen.getByLabelText("到店取貨"));
  expect(screen.getByLabelText("到店付款")).toBeInTheDocument();
});

it("retains valid values when checkout validation fails", async () => {
  const checkoutService = createCheckoutService({
    validate: async () => ({ ok: false, error: { code: "checkout-unavailable", message: "暫時無法確認訂單。", retryable: true } }),
  });
  renderCheckout({ checkoutService });

  await reachReview();
  fireEvent.click(screen.getByRole("button", { name: "送出訂單" }));

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("暫時無法確認訂單"));
  fireEvent.click(screen.getByRole("button", { name: "返回配送方式" }));
  expect(screen.getByLabelText("宅配地址")).toHaveValue(validDraft.address);
  expect(screen.getByLabelText("信用卡")).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "上一步" }));
  expect(screen.getByLabelText("姓名")).toHaveValue(validDraft.name);
  expect(screen.getByLabelText("手機號碼")).toHaveValue(validDraft.phone);
  expect(screen.getByLabelText("Email（選填）")).toHaveValue(validDraft.email);
});

it("disables the final submit while processing", async () => {
  let resolveSubmit: ((result: Awaited<ReturnType<CheckoutService["submit"]>>) => void) | undefined;
  const checkoutService = createCheckoutService({
    submit: () => new Promise((resolve) => { resolveSubmit = resolve; }),
  });
  renderCheckout({ checkoutService });
  await reachReview();

  fireEvent.click(screen.getByRole("button", { name: "送出訂單" }));

  await waitFor(() => expect(screen.getByRole("button", { name: "處理中" })).toBeDisabled());
  await act(async () => {
    resolveSubmit?.({ ok: true, value: { orderReference: "MOCK-ORDER-001", status: "confirmed", total: cart.subtotal } });
  });
});

it("submits only once when the final action is clicked repeatedly", async () => {
  let calls = 0;
  let resolveSubmit: ((result: Awaited<ReturnType<CheckoutService["submit"]>>) => void) | undefined;
  const checkoutService = createCheckoutService({
    submit: () => {
      calls += 1;
      return new Promise((resolve) => { resolveSubmit = resolve; });
    },
  });
  renderCheckout({ checkoutService });
  await reachReview();

  const submit = screen.getByRole("button", { name: "送出訂單" });
  fireEvent.click(submit);
  fireEvent.click(submit);
  await waitFor(() => expect(calls).toBe(1));
  await act(async () => {
    resolveSubmit?.({ ok: true, value: { orderReference: "MOCK-ORDER-001", status: "confirmed", total: cart.subtotal } });
  });
});

it("keeps the draft available for retry after payment failure", async () => {
  let calls = 0;
  const checkoutService = createCheckoutService({
    submit: async () => {
      calls += 1;
      return calls === 1
        ? { ok: false as const, error: { code: "payment-failed" as const, message: "付款未完成，請再試一次。", retryable: true } }
        : { ok: true as const, value: { orderReference: "MOCK-ORDER-001", status: "confirmed" as const, total: cart.subtotal } };
    },
  });
  renderCheckout({ checkoutService });
  await reachReview();
  fireEvent.click(screen.getByRole("button", { name: "送出訂單" }));

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("付款未完成"));
  fireEvent.click(screen.getByRole("button", { name: "再試一次" }));
  await waitFor(() => expect(screen.getByText("訂單編號：MOCK-ORDER-001")).toBeInTheDocument());
  expect(calls).toBe(2);
});

it("shows the deterministic order reference and primary phone help on success", async () => {
  renderCheckout();
  await reachReview();
  fireEvent.click(screen.getByRole("button", { name: "送出訂單" }));

  await waitFor(() => expect(screen.getByText("訂單編號：MOCK-ORDER-001")).toBeInTheDocument());
  expect(screen.getByRole("link", { name: "電話聯絡我們" })).toHaveAttribute("href", "tel:0800000000");
  expect(screen.getByRole("link", { name: "LINE 聯絡我們" })).toHaveAttribute("href", "https://line.me/R/ti/p/@longying-tea-shop");
});

it("uses polite live status and visible error summary semantics", async () => {
  renderCheckout();
  await waitFor(() => expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument());
  expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  expect(screen.getByRole("alert")).toHaveTextContent("請填寫手機號碼");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

it("expands a four-line cart summary without changing the service subtotal", async () => {
  const fourLineCart: Cart = {
    lines: [0, 1, 2, 3].map((index) => ({ ...line, productId: `tea-${index}`, variantId: `variant-${index}`, productName: `茶品 ${index + 1}`, quantity: 1 })),
    subtotal: { currency: "TWD", amount: 3200 },
  };
  renderCheckout({ currentCart: fourLineCart });
  await reachReview();

  expect(screen.getByText("茶品 1")).toBeInTheDocument();
  expect(screen.queryByText("茶品 4")).toBeNull();
  const disclosure = screen.getByRole("button", { name: "顯示全部 4 項茶品" });
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(disclosure).toHaveAttribute("aria-controls", "checkout-summary-lines");
  fireEvent.click(disclosure);
  expect(screen.getByText("茶品 4")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "收合茶品" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("小計：NT$3,200")).toBeInTheDocument();
});
