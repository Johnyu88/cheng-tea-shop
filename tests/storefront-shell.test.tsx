import { render, screen } from "@testing-library/react";
import { StorefrontShell } from "@/features/storefront/components/storefront-shell";

it("provides the same storefront navigation on empty and active shopping pages", () => {
  render(
    <StorefrontShell>
      <main><h1>購物車是空的</h1></main>
    </StorefrontShell>,
  );

  expect(screen.getByRole("banner")).toHaveTextContent("陳老師茶行");
  expect(screen.getByRole("link", { name: "回首頁" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "繼續選茶" })).toHaveAttribute("href", "/#catalog");
  expect(screen.getByRole("link", { name: "查看購物車" })).toHaveAttribute("href", "/cart");
});
