import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemoCheckoutPage } from "@/features/demo/components/demo-checkout-page";
import { demoCheckoutSuccessStorageKey } from "@/features/demo/components/demo-checkout-success-page";

vi.mock("@/features/commerce/components/commerce-provider", () => ({
  useCommerce: () => ({ cartService: { getCart: async () => ({ ok: true, value: { lines: [], subtotal: { currency: "TWD", amount: 0 } } }) } }),
}));
afterEach(() => { window.sessionStorage.clear(); });

it("shows an existing confirmed receipt instead of an empty checkout when the cart is already empty", async () => {
  const orderId = "DEMO-12345678-1234-1234-1234-123456789abc";
  window.sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify({ orderId, accessSecret: "demo-secret" }));
  render(<DemoCheckoutPage />);
  expect(await screen.findByRole("heading", { name: "感謝您的購買" })).toBeInTheDocument();
  expect(screen.getByText("訂單編號：" + orderId)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "主動查看訂單" })).toHaveAttribute("href", "/orders?order=" + orderId);
  expect(screen.queryByText("購物車是空的")).not.toBeInTheDocument();
  expect(screen.queryByText("取消本次結帳")).not.toBeInTheDocument();
});

it("never claims an order succeeded when there is no confirmed receipt", async () => {
  render(<DemoCheckoutPage />);
  expect(await screen.findByRole("heading", { name: "購物車是空的" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "感謝您的購買" })).not.toBeInTheDocument();
});
