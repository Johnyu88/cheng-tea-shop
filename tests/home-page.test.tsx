import { render, screen } from "@testing-library/react";
import { HomePage } from "@/features/home/components/home-page";

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
