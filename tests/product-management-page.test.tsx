import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
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

afterEach(() => vi.unstubAllGlobals());

test("loads existing catalog data and saves edits through the shared catalog API", async () => {
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
});
