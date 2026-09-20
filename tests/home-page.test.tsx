import { render, screen, waitFor } from "@testing-library/react";
import { HomePage } from "@/features/home/components/home-page";
import { createMockCatalogService } from "@/lib/domain";

it("gives visitors one clear storefront starting point", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1, name: "慢慢選一杯好茶" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "開始選茶" })).toHaveAttribute("href", "#baseline");
});

it("provides a named storefront shell for keyboard and assistive technology users", () => {
  render(<HomePage />);

  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "龍映茗茶" })).toHaveAttribute("href", "#top");
  expect(screen.getByRole("navigation", { name: "主要導覽" })).toBeInTheDocument();
});

it("renders the first three catalog products through the catalog service", async () => {
  render(<HomePage catalogService={createMockCatalogService()} />);

  expect(screen.getByText("正在整理茶品")).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByRole("heading", { level: 2, name: "推薦茶品" })).toBeInTheDocument();
  });

  expect(screen.getAllByRole("article")).toHaveLength(3);
  expect(screen.getByText("合成茶品 001")).toBeInTheDocument();
  expect(screen.getByText("合成茶品 003")).toBeInTheDocument();
  expect(screen.getAllByText("商品照片準備中")).toHaveLength(3);
});

it("keeps the catalog section useful when no products are available", async () => {
  render(<HomePage catalogService={createMockCatalogService({ scenario: "empty" })} />);

  await waitFor(() => {
    expect(screen.getByText("目前還沒有可展示的茶品。")).toBeInTheDocument();
  });
});

it("explains when the catalog cannot be loaded", async () => {
  render(<HomePage catalogService={createMockCatalogService({ scenario: "catalog-error" })} />);

  await waitFor(() => {
    expect(screen.getByText("目前無法取得茶品目錄，請稍後再試。")).toBeInTheDocument();
  });
});
