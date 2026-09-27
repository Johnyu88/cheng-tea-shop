import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminOrdersPage } from "@/features/demo/components/admin-orders-page";

it("provides a clear home link without logging in or modifying an order", () => {
  render(<AdminOrdersPage />);
  expect(screen.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("button", { name: "確認店家身分" })).toBeInTheDocument();
});
