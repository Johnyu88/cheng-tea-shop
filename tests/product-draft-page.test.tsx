import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import type { Product, ProductDraft, PublishingService } from "@/lib/domain";
import { CommerceProvider } from "@/features/commerce/components/commerce-provider";
import { ProductDraftPage } from "@/features/publishing/components/product-draft-page";

const publishedProduct: Product = {
  id: "mock-published-1",
  slug: "spring-tea",
  name: "春茶",
  category: "oolong",
  tasteTags: [],
  summary: "清香明亮。",
  image: { src: null, alt: "商品照片準備中", isPlaceholder: true },
  variants: [{ id: "mock-published-1-variant", specification: "150g", price: { currency: "TWD", amount: 1200 }, inventoryStatus: "available", maxQuantity: 5 }],
  publication: "published",
};

function createPublishingService(overrides: Partial<PublishingService> = {}): PublishingService {
  return {
    generateSummary: async (draft) => ({ ok: true, value: `茶名：${draft.name}｜產地：${draft.origin ?? "未提供"}` }),
    saveDraft: async (draft) => ({ ok: true, value: draft }),
    publishDraft: async () => ({ ok: true, value: publishedProduct }),
    ...overrides,
  };
}

function renderPage(service = createPublishingService()) {
  return render(
    <CommerceProvider services={{ publishingService: service }}>
      <ProductDraftPage />
    </CommerceProvider>,
  );
}

function fillMinimumFields() {
  fireEvent.change(screen.getByLabelText("茶名"), { target: { value: "春茶" } });
  fireEvent.change(screen.getByLabelText("單一規格"), { target: { value: "150g" } });
  fireEvent.change(screen.getByLabelText("價格（TWD）"), { target: { value: "1200" } });
  fireEvent.change(screen.getByLabelText("茶類"), { target: { value: "oolong" } });
  fireEvent.click(screen.getByLabelText("有貨"));
}

it("labels the prototype and presents the five minimum fields", () => {
  renderPage();

  expect(screen.getByText("這是原型頁面：尚未實作真實管理員驗證。")).toBeInTheDocument();
  expect(screen.getByLabelText("茶名")).toBeInTheDocument();
  expect(screen.getByLabelText("單一規格")).toBeInTheDocument();
  expect(screen.getByLabelText("價格（TWD）")).toBeInTheDocument();
  expect(screen.getByLabelText("茶類")).toBeInTheDocument();
  expect(screen.getByLabelText("有貨")).toBeInTheDocument();
  expect(screen.getByLabelText("售完")).toBeInTheDocument();
});

it("shows a linked required-field summary before a draft can be saved", () => {
  renderPage();

  fireEvent.click(screen.getByRole("button", { name: "儲存草稿" }));

  expect(screen.getByRole("alert")).toHaveTextContent("請先完成必填欄位");
  expect(screen.getByRole("link", { name: "茶名" })).toHaveAttribute("href", "#product-name");
  expect(screen.getByRole("button", { name: "確認並上架" })).toBeDisabled();
});

it("rejects a non-integer TWD price without losing the entered name", () => {
  renderPage();
  fillMinimumFields();
  fireEvent.change(screen.getByLabelText("價格（TWD）"), { target: { value: "1200.5" } });

  fireEvent.click(screen.getByRole("button", { name: "儲存草稿" }));

  expect(screen.getByRole("alert")).toHaveTextContent("請輸入整數 TWD 價格");
  expect(screen.getByLabelText("茶名")).toHaveValue("春茶");
  expect(screen.getByLabelText("價格（TWD）")).toHaveValue("1200.5");
});

it("keeps zero to three local photo metadata and recovers after rejecting an oversized selection", () => {
  const createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
  const revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
  renderPage();
  const photoInput = screen.getByLabelText("選擇商品照片（最多三張）");
  const first = new File(["first"], "first.jpg", { type: "image/jpeg" });
  const second = new File(["second"], "second.png", { type: "image/png" });
  const third = new File(["third"], "third.webp", { type: "image/webp" });
  const extra = new File(["extra"], "extra.jpg", { type: "image/jpeg" });

  fireEvent.change(photoInput, { target: { files: [first, second, third] } });
  expect(screen.getByRole("img", { name: "first.jpg 預覽" })).toHaveAttribute("src", "blob:first.jpg");
  expect(screen.getByText("已選擇 3／3 張照片")).toBeInTheDocument();

  fireEvent.change(photoInput, { target: { files: [extra] } });
  expect(screen.getByRole("alert")).toHaveTextContent("最多三張");
  expect(screen.getByRole("img", { name: "first.jpg 預覽" })).toBeInTheDocument();
  expect(createObjectURL).toHaveBeenCalledTimes(3);
});

it("generates grounded copy that the operator can edit", async () => {
  const generateSummary = vi.fn(async (draft: ProductDraft) => ({ ok: true as const, value: `茶名：${draft.name}｜產地：阿里山` }));
  renderPage(createPublishingService({ generateSummary }));
  fillMinimumFields();
  fireEvent.change(screen.getByLabelText("產地（選填）"), { target: { value: "阿里山" } });

  fireEvent.click(screen.getByRole("button", { name: "產生介紹草稿" }));

  await waitFor(() => expect(screen.getByLabelText("商品介紹草稿（可編輯）")).toHaveValue("茶名：春茶｜產地：阿里山"));
  fireEvent.change(screen.getByLabelText("商品介紹草稿（可編輯）"), { target: { value: "由店家確認的介紹" } });
  expect(screen.getByLabelText("商品介紹草稿（可編輯）")).toHaveValue("由店家確認的介紹");
  expect(generateSummary).toHaveBeenCalledWith(expect.objectContaining({ name: "春茶", origin: "阿里山" }));
});

it("preserves the draft after a save failure", async () => {
  renderPage(createPublishingService({ saveDraft: async () => ({ ok: false, error: { code: "publishing-unavailable", message: "暫時無法儲存。", retryable: true } }) }));
  fillMinimumFields();

  fireEvent.click(screen.getByRole("button", { name: "儲存草稿" }));

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("暫時無法儲存"));
  expect(screen.getByLabelText("茶名")).toHaveValue("春茶");
  expect(screen.getByLabelText("單一規格")).toHaveValue("150g");
});

it("toggles between phone and desktop previews", () => {
  renderPage();
  fillMinimumFields();

  fireEvent.click(screen.getByRole("button", { name: "預覽手機版" }));
  expect(screen.getByLabelText("商品預覽")).toHaveAttribute("data-preview-mode", "mobile");
  fireEvent.click(screen.getByRole("button", { name: "預覽電腦版" }));
  expect(screen.getByLabelText("商品預覽")).toHaveAttribute("data-preview-mode", "desktop");
});

it("requires minimum validation and an explicit confirmation before publishing", () => {
  renderPage();
  expect(screen.getByRole("button", { name: "確認並上架" })).toBeDisabled();
  fillMinimumFields();
  expect(screen.getByRole("button", { name: "確認並上架" })).toBeDisabled();

  fireEvent.click(screen.getByLabelText("我已確認內容，將上架這項商品"));
  expect(screen.getByRole("button", { name: "確認並上架" })).toBeEnabled();
});

it("prevents duplicate publish mutations while publication is processing", async () => {
  let resolvePublish: ((result: Awaited<ReturnType<PublishingService["publishDraft"]>>) => void) | undefined;
  const publishDraft = vi.fn(() => new Promise<Awaited<ReturnType<PublishingService["publishDraft"]>>>((resolve) => { resolvePublish = resolve; }));
  renderPage(createPublishingService({ publishDraft }));
  fillMinimumFields();
  fireEvent.click(screen.getByLabelText("我已確認內容，將上架這項商品"));
  const publish = screen.getByRole("button", { name: "確認並上架" });

  fireEvent.click(publish);
  fireEvent.click(publish);
  await waitFor(() => expect(publishDraft).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("button", { name: "上架處理中" })).toBeDisabled();
  await act(async () => { resolvePublish?.({ ok: true, value: publishedProduct }); });
});

it("shows a distinct published success state with one synthetic variant", async () => {
  renderPage();
  fillMinimumFields();
  fireEvent.click(screen.getByLabelText("我已確認內容，將上架這項商品"));
  fireEvent.click(screen.getByRole("button", { name: "確認並上架" }));

  await waitFor(() => expect(screen.getByRole("heading", { name: "商品已上架" })).toBeInTheDocument());
  expect(screen.getByText("合成商品編號：mock-published-1")).toBeInTheDocument();
  expect(screen.getByText("已建立 1 個規格" )).toBeInTheDocument();
});
