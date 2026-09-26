import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import type { Product, PublishingService } from "@/lib/domain";
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
  fireEvent.change(screen.getByLabelText("規格"), { target: { value: "150g" } });
  fireEvent.change(screen.getByLabelText("價格（TWD）"), { target: { value: "1200" } });
  fireEvent.change(screen.getByLabelText("茶類"), { target: { value: "oolong" } });
  fireEvent.change(screen.getByLabelText("庫存"), { target: { value: "available" } });
}

it("labels the prototype and presents the five minimum fields", () => {
  renderPage();

  expect(screen.getByText("這是本機 Demo：沒有真實管理員驗證，不會連接正式 ERP 或外部影像服務。")).toBeInTheDocument();
  expect(screen.getByLabelText("茶名")).toBeInTheDocument();
  expect(screen.getByLabelText("規格")).toBeInTheDocument();
  expect(screen.getByLabelText("價格（TWD）")).toBeInTheDocument();
  expect(screen.getByLabelText("茶類")).toBeInTheDocument();
  expect(screen.getByLabelText("庫存")).toBeInTheDocument();
  expect(screen.getByLabelText("口感")).toBeInTheDocument();
  expect(screen.getByLabelText("香氣")).toBeInTheDocument();
  expect(screen.getByLabelText("產地")).toBeInTheDocument();
});

it("shows a linked required-field summary before a draft can be saved", () => {
  renderPage();

  fireEvent.click(screen.getByRole("button", { name: "儲存商品" }));

  expect(screen.getByRole("alert")).toHaveTextContent("請先完成必填欄位");
  expect(screen.getByRole("alert")).toHaveTextContent("茶名：請填寫茶名");
  expect(screen.getByRole("button", { name: "確認並上架" })).toBeDisabled();
});

it("rejects a non-integer TWD price without losing the entered name", () => {
  renderPage();
  fillMinimumFields();
  fireEvent.change(screen.getByLabelText("價格（TWD）"), { target: { value: "1200.5" } });

  fireEvent.click(screen.getByRole("button", { name: "儲存商品" }));

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

it("revokes a removed photo preview immediately and remaining previews when unmounted", () => {
  const createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
  const revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
  const { unmount } = renderPage();
  const photoInput = screen.getByLabelText("選擇商品照片（最多三張）");
  const first = new File(["first"], "first.jpg", { type: "image/jpeg" });
  const second = new File(["second"], "second.jpg", { type: "image/jpeg" });

  fireEvent.change(photoInput, { target: { files: [first, second] } });
  fireEvent.click(screen.getByRole("button", { name: "移除 first.jpg" }));
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:first.jpg");

  unmount();
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:second.jpg");
});

it("does not expose retired image AI or fake progress controls", () => {
  renderPage();
  expect(screen.queryByText(/Mock|辨識|合成預覽|產生介紹/)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "產生介紹草稿" })).not.toBeInTheDocument();
  expect(screen.getByText(/照片由店家自行拍攝/)).toBeInTheDocument();
});

it("preserves the draft after a save failure", async () => {
  renderPage(createPublishingService({ saveDraft: async () => ({ ok: false, error: { code: "publishing-unavailable", message: "暫時無法儲存。", retryable: true } }) }));
  fillMinimumFields();

  fireEvent.click(screen.getByRole("button", { name: "儲存商品" }));

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("暫時無法儲存"));
  expect(screen.getByLabelText("茶名")).toHaveValue("春茶");
  expect(screen.getByLabelText("規格")).toHaveValue("150g");
});

it("prevents duplicate save mutations and announces that saving is in progress", async () => {
  let resolveSave: ((result: Awaited<ReturnType<PublishingService["saveDraft"]>>) => void) | undefined;
  const saveDraft = vi.fn(() => new Promise<Awaited<ReturnType<PublishingService["saveDraft"]>>>((resolve) => { resolveSave = resolve; }));
  renderPage(createPublishingService({ saveDraft }));
  fillMinimumFields();
  const save = screen.getByRole("button", { name: "儲存商品" });

  fireEvent.click(save);
  fireEvent.click(save);

  await waitFor(() => expect(saveDraft).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("status")).toHaveTextContent("正在儲存商品");
  await act(async () => { resolveSave?.({ ok: true, value: { name: "春茶", specification: "150g", price: { currency: "TWD", amount: 1200 }, category: "oolong", inventoryStatus: "available", tasteTags: [] } }); });
});


it("requires minimum validation and an explicit confirmation before publishing", () => {
  renderPage();
  expect(screen.getByRole("button", { name: "確認並上架" })).toBeDisabled();
  fillMinimumFields();
  expect(screen.getByRole("button", { name: "確認並上架" })).toBeDisabled();

  fireEvent.click(screen.getByLabelText("我已確認照片與商品資料"));
  expect(screen.getByRole("button", { name: "確認並上架" })).toBeEnabled();
});

it("requires a new confirmation whenever publishable content changes", () => {
  const createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL: vi.fn() });
  renderPage();
  fillMinimumFields();
  const confirmation = screen.getByLabelText("我已確認照片與商品資料");

  fireEvent.click(confirmation);
  fireEvent.change(screen.getByLabelText("茶名"), { target: { value: "新春茶" } });
  expect(confirmation).not.toBeChecked();

  fireEvent.click(confirmation);
  fireEvent.change(screen.getByLabelText("產地"), { target: { value: "阿里山" } });
  expect(confirmation).not.toBeChecked();

  fireEvent.click(confirmation);
  fireEvent.change(screen.getByLabelText("商品介紹"), { target: { value: "店家確認介紹" } });
  expect(confirmation).not.toBeChecked();

  fireEvent.click(confirmation);
  fireEvent.click(screen.getByLabelText("清香"));
  expect(confirmation).not.toBeChecked();

  fireEvent.click(confirmation);
  fireEvent.change(screen.getByLabelText("選擇商品照片（最多三張）"), { target: { files: [new File(["photo"], "tea.jpg", { type: "image/jpeg" })] } });
  expect(confirmation).not.toBeChecked();

  fireEvent.click(confirmation);
  fireEvent.click(screen.getByRole("button", { name: "移除 tea.jpg" }));
  expect(confirmation).not.toBeChecked();
});

it("prevents duplicate publish mutations while publication is processing", async () => {
  let resolvePublish: ((result: Awaited<ReturnType<PublishingService["publishDraft"]>>) => void) | undefined;
  const publishDraft = vi.fn(() => new Promise<Awaited<ReturnType<PublishingService["publishDraft"]>>>((resolve) => { resolvePublish = resolve; }));
  renderPage(createPublishingService({ publishDraft }));
  fillMinimumFields();
  fireEvent.click(screen.getByLabelText("我已確認照片與商品資料"));
  const publish = screen.getByRole("button", { name: "確認並上架" });

  fireEvent.click(publish);
  fireEvent.click(publish);
  await waitFor(() => expect(publishDraft).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("button", { name: "上架處理中" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("正在上架商品");
  await act(async () => { resolvePublish?.({ ok: true, value: publishedProduct }); });
});

it("preserves the draft after publication fails", async () => {
  renderPage(createPublishingService({ publishDraft: async () => ({ ok: false, error: { code: "publishing-unavailable", message: "暫時無法上架。", retryable: true } }) }));
  fillMinimumFields();
  fireEvent.change(screen.getByLabelText("商品介紹"), { target: { value: "店家確認介紹" } });
  fireEvent.click(screen.getByLabelText("我已確認照片與商品資料"));

  fireEvent.click(screen.getByRole("button", { name: "確認並上架" }));

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("暫時無法上架"));
  expect(screen.getByLabelText("茶名")).toHaveValue("春茶");
  expect(screen.getByLabelText("商品介紹")).toHaveValue("店家確認介紹");
  expect(screen.getByLabelText("我已確認照片與商品資料")).toBeChecked();
  expect(screen.getByRole("status")).toHaveTextContent("暫時無法上架");
});

it("shows a distinct published success state with one synthetic variant", async () => {
  renderPage();
  fillMinimumFields();
  fireEvent.click(screen.getByLabelText("我已確認照片與商品資料"));
  fireEvent.click(screen.getByRole("button", { name: "確認並上架" }));

  await waitFor(() => expect(screen.getByRole("heading", { name: "商品已上架" })).toBeInTheDocument());
  expect(screen.getByText("商品編號：mock-published-1")).toBeInTheDocument();
  expect(screen.getByText("已上架商品：春茶")).toBeInTheDocument();
  expect(screen.getByText("規格：150g／NT$1200")).toBeInTheDocument();
});
