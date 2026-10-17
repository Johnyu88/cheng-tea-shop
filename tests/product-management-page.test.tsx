import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { demoApi } from "@/features/demo/demo-api";
import type { Product } from "@/lib/domain";
import { ProductManagementPage } from "@/features/publishing/components/product-management-page";

const product: Product = {
  id: "tea-001",
  slug: "tea-001",
  name: "台灣佛手茶",
  category: "oolong",
  tasteTags: ["light"],
  summary: "清香。",
  teaRegion: "台灣",
  aroma: "柑橘",
  taste: "柔和",
  image: { src: "/tea.jpg", alt: "台灣佛手茶", isPlaceholder: false },
  variants: [{ id: "tea-001-v", specification: "150g", price: { currency: "TWD", amount: 800 }, inventoryStatus: "available", maxQuantity: 5 }],
  publication: "published",
};

beforeEach(() => vi.spyOn(demoApi, "merchantStatus").mockResolvedValue({ provider: "password", state: "ready", simulated: false, authenticated: true, passkey: { enabled: false, registered: false } }));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

test("loads existing catalog data and saves edits through the shared catalog API", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: { items: [product] } }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: { ...product, variants: [{ ...product.variants[0], price: { currency: "TWD", amount: 999 } }] } }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  render(<ProductManagementPage />);
  await waitFor(() => expect(screen.getByText("台灣佛手茶")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "編輯" }));
  fireEvent.change(screen.getByLabelText("價格（TWD）"), { target: { value: "999" } });
  fireEvent.click(screen.getByRole("button", { name: "儲存編輯" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const patchRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
  expect(JSON.parse(String(patchRequest.body))).toMatchObject({ id: "tea-001", price: { currency: "TWD", amount: 999 } });
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining(product.name));
});

test("shows newly saved draft first with a clear unpublished count", async () => {
  const draft: Product = { ...product, id: "draft-002", slug: "draft-002", name: "測試紅茶A", publication: "draft" };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, value: { items: [product, draft] } }), { status: 200 })));
  render(<ProductManagementPage />);
  expect(await screen.findByRole("link", { name: "前往購物前台" })).toHaveAttribute("href", "/");
  await waitFor(() => expect(screen.getByText("測試紅茶A")).toBeInTheDocument());
  expect(screen.getByRole("status")).toHaveTextContent("共 2 筆商品，其中 1 筆未上架");
  const names = Array.from(document.querySelectorAll(".product-admin-item h2")).map((node) => node.textContent);
  expect(names).toEqual(["測試紅茶A", product.name]);
  expect(screen.getByText("上架狀態：草稿／未上架（顧客看不到）")).toBeInTheDocument();
});

test("shows photo upload preview and sends it only with explicit confirmed save", async () => {
  const updated: Product = { ...product, image: { src: "/api/demo/catalog/media/new-photo.png", alt: "new photo", isPlaceholder: false } };
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: { items: [product] } }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: updated }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<ProductManagementPage />);
  await waitFor(() => expect(screen.getByText(product.name)).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "編輯" }));
  expect(screen.getByAltText(`目前照片：${product.name}`)).toHaveAttribute("src", product.image.src);
  const picker = screen.getByLabelText(/選擇新照片以更換/);
  fireEvent.change(picker, { target: { files: [new File([new Uint8Array([137,80,78,71,13,10,26,10])], "sample.png", { type: "image/png" })] } });
  expect(await screen.findByAltText("新照片預覽（尚未儲存）")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "儲存編輯" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const payload = JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body));
  expect(payload).toMatchObject({ id: product.id, fermentation: "", roast: "", brewing: "", tasteTags: ["light"], imageDataUrl: expect.stringMatching(/^data:image\/png;base64,/) });
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining("將更換商品照片"));
  expect(await screen.findByText(/資料與照片已儲存/)).toBeInTheDocument();
});

test("loads optional tea facts back into the editor and includes them on save", async () => {
  const persisted: Product = { ...product, tasteTags: ["sweet"], fermentation: "輕發酵", roast: "微", brewing: "建議90度水" };
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: { items: [persisted] } }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: persisted }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<ProductManagementPage />);
  await waitFor(() => expect(screen.getByText(product.name)).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "編輯" }));
  expect(screen.getByLabelText("發酵（選填）")).toHaveValue("輕發酵");
  expect(screen.getByLabelText("焙火（選填）")).toHaveValue("微");
  expect(screen.getByLabelText("沖泡方式（選填）")).toHaveValue("建議90度水");
  fireEvent.click(screen.getByRole("button", { name: "儲存編輯" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const saved = JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body));
  expect(saved).toMatchObject({ id: product.id, tasteTags: ["sweet"], fermentation: "輕發酵", roast: "微", brewing: "建議90度水" });
});

test("keeps the product list visible when one product has no variants", async () => {
  const malformed = { ...product, id: "broken", name: "資料不完整商品", variants: undefined };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, value: { items: [product, malformed] } }), { status: 200 })));

  render(<ProductManagementPage />);

  expect(await screen.findByText("資料不完整商品")).toBeInTheDocument();
  expect(screen.getByText(product.name)).toBeInTheDocument();
  expect(screen.getByText("規格：未設定／NT$—")).toBeInTheDocument();
  expect(screen.queryByText("商品管理暫時無法顯示")).not.toBeInTheDocument();
});

test("shows a recoverable error instead of a blank page for an unexpected render error", async () => {
  const malformed = { ...product, image: null };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, value: { items: [malformed] } }), { status: 200 })));

  render(<ProductManagementPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent("商品管理暫時無法顯示");
  expect(screen.getByRole("button", { name: "重新整理商品管理" })).toBeInTheDocument();
});

test("shows a visible message when the browser has no FileReader", async () => {
  vi.stubGlobal("FileReader", undefined);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, value: { items: [product] } }), { status: 200 })));
  render(<ProductManagementPage />);
  await screen.findByText(product.name);
  fireEvent.click(screen.getByRole("button", { name: "編輯" }));
  fireEvent.change(screen.getByLabelText(/選擇新照片以更換/), { target: { files: [new File(["photo"], "sample.jpg", { type: "image/jpeg" })] } });
  expect(await screen.findByText("這張照片無法讀取，請改選其他照片；iPhone 可到「設定 → 相機 → 格式」選「最相容」。原照片未更動。", { exact: true })).toBeInTheDocument();
});

test("offers delete only for unpublished products and asks for confirmation first", async () => {
  const draftProduct: Product = { ...product, id: "tea-draft", slug: "tea-draft", name: "測試草稿茶", publication: "draft" };
  const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: { items: [product, draftProduct] } }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: { id: "tea-draft", name: "測試草稿茶" } }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  render(<ProductManagementPage />);
  await screen.findByText("測試草稿茶");
  expect(screen.getAllByRole("button", { name: "刪除" })).toHaveLength(1);

  fireEvent.click(screen.getByRole("button", { name: "刪除" }));
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining("確定要刪除「測試草稿茶」"));
  expect(fetchMock).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "刪除" }));
  await waitFor(() => expect(screen.getByText("「測試草稿茶」已刪除。")).toBeInTheDocument());
  const deleteCall = fetchMock.mock.calls[1]!;
  expect(deleteCall[0]).toBe("/api/demo/catalog");
  expect(deleteCall[1]).toMatchObject({ method: "DELETE", body: JSON.stringify({ id: "tea-draft" }) });
  expect(screen.queryByRole("heading", { name: "測試草稿茶" })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "台灣佛手茶" })).toBeInTheDocument();
});

