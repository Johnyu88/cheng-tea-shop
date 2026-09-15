import { render, screen } from "@testing-library/react";
import { HomePage } from "@/features/home/components/home-page";

it("gives visitors one clear storefront starting point", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1, name: "慢慢選一杯好茶" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "開始選茶" })).toHaveAttribute("href", "#baseline");
});
