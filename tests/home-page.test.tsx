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
  expect(screen.getByRole("link", { name: "龍映茗茶" })).toHaveAttribute("href", "#top");
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

it("introduces the teacher with an accessible portrait", () => {
  render(<HomePage catalogService={createMockCatalogService()} />);

  expect(screen.getByRole("img", { name: "陳老師在茶行裡的照片" }).getAttribute("src")).toContain(
    "teacher-portrait.webp",
  );
});

it("keeps the teacher story video manual and muted", () => {
  render(<HomePage catalogService={createMockCatalogService()} />);

  const video = screen.getByLabelText("陳老師茶行介紹影片");
  expect(video).toHaveAttribute("controls");
  expect(video).toHaveProperty("muted", true);
  expect(video).toHaveAttribute("playsinline");
  expect(video).not.toHaveAttribute("autoplay");
});
