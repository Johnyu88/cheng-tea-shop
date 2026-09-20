import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CatalogBrowser } from "@/features/catalog/components/catalog-browser";
import { createMockCatalogService } from "@/lib/domain";

it("loads the first page of the complete catalog and offers more products", async () => {
  render(<CatalogBrowser catalogService={createMockCatalogService({ pageSize: 2 })} />);

  expect(screen.getByRole("status")).toHaveTextContent("正在整理茶品目錄");

  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "全部茶品" })).toBeInTheDocument();
  });

  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "載入更多茶品" })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: "查看茶品" })[0]).toHaveAttribute("href", "/tea/mock-tea-001");
});

it("reloads the catalog when a visitor chooses a taste filter", async () => {
  render(<CatalogBrowser catalogService={createMockCatalogService({ pageSize: 12 })} />);

  await waitFor(() => expect(screen.getByText("合成茶品 001")).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: "焙火" }));

  await waitFor(() => {
    expect(screen.queryByText("合成茶品 001")).not.toBeInTheDocument();
    expect(screen.getByText("合成茶品 003")).toBeInTheDocument();
  });
});

it("appends the next cursor page without discarding existing products", async () => {
  render(<CatalogBrowser catalogService={createMockCatalogService({ pageSize: 2 })} />);

  await waitFor(() => expect(screen.getByText("合成茶品 001")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "載入更多茶品" }));

  await waitFor(() => expect(screen.getByText("合成茶品 003")).toBeInTheDocument());
  expect(screen.getByText("合成茶品 001")).toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(4);
});
