import { render, screen, waitFor, within } from "@testing-library/react";
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
  expect(screen.getByRole("link", { name: "陳老師茶行" })).toHaveAttribute("href", "#top");
  expect(screen.getByRole("navigation", { name: "主要導覽" })).toBeInTheDocument();
});

it("renders the first three catalog products through the catalog service", async () => {
  render(<HomePage catalogService={createMockCatalogService()} />);

  expect(screen.getByText("正在整理茶品")).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByRole("heading", { level: 2, name: "推薦茶品" })).toBeInTheDocument();
  });

  const preview = screen.getByRole("region", { name: "推薦茶品" });
  expect(within(preview).getAllByRole("article")).toHaveLength(3);
  expect(within(preview).getByText("合成茶品 001")).toBeInTheDocument();
  expect(within(preview).getByText("合成茶品 003")).toBeInTheDocument();
  expect(within(preview).getAllByText("商品照片準備中")).toHaveLength(3);
  expect(within(preview).getAllByRole("link", { name: "查看茶品" })[0]).toHaveAttribute(
    "href",
    "/tea/mock-tea-001",
  );
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
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });
});

it("introduces the teacher with the homepage composite", () => {
  render(<HomePage catalogService={createMockCatalogService()} />);

  expect(screen.getByRole("img", { name: "陳老師茶行首頁合成照" }).getAttribute("src")).toContain(
    "teacher-hero-desktop-candidate.png",
  );
});

it("uses approved desktop/mobile composite candidates instead of a video", () => {
  render(<HomePage catalogService={createMockCatalogService()} />);

  expect(screen.getByRole("img", { name: "陳老師茶行首頁合成照" })).toHaveAttribute("src", expect.stringContaining("teacher-hero-desktop"));
  expect(screen.getByRole("img", { name: "陳老師茶行首頁合成照" })).toHaveAttribute("srcSet", expect.stringContaining("teacher-hero-mobile"));
  expect(screen.queryByLabelText("陳老師茶行介紹影片")).toBeNull();
});

it("does not link to the retired customer order lookup", () => {
  render(<HomePage catalogService={createMockCatalogService()} />);
  expect(screen.queryByRole("link", { name: "訂單查詢" })).toBeNull();
});

it("does not expose the retired brand name in the public storefront shell", () => {
  render(<HomePage catalogService={createMockCatalogService()} />);

  expect(screen.queryByText("龍映茗茶")).toBeNull();
  expect(screen.queryByLabelText("龍映茗茶")).toBeNull();
  expect(screen.getByRole("link", { name: "陳老師茶行" })).toBeInTheDocument();
});
