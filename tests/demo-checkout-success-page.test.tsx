import { render, screen, waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { DemoCheckoutSuccessPage } from "@/features/demo/components/demo-checkout-success-page";

afterEach(() => window.sessionStorage.clear());

it("shows an independent order success page without exposing the lookup token", () => {
  render(<DemoCheckoutSuccessPage orderId="DEMO-123" accessSecret="secret-token" status="confirmed" />);

  expect(screen.getByRole("heading", { name: "感謝您的購買" })).toBeInTheDocument();
  expect(screen.getByText("訂單編號：DEMO-123")).toBeInTheDocument();
  expect(screen.getByText("已收到您的示範訂單，店家將依序處理。")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "主動查看訂單" })).toHaveAttribute("href", "/orders?order=DEMO-123");
  expect(document.body).not.toHaveTextContent("secret-token");
});

it("uses only the matching tab receipt when the route already has an order number", async () => {
  const { demoCheckoutSuccessStorageKey } = await import("@/features/demo/components/demo-checkout-success-page");
  window.sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify({
    orderId: "DEMO-OTHER", accessSecret: "other-private-token", status: "shipped",
  }));
  const { unmount } = render(<DemoCheckoutSuccessPage orderId="DEMO-ROUTE" status="confirmed" />);
  expect(screen.getByText(/此分頁沒有完整查單憑證/)).toBeInTheDocument();
  expect(document.body).not.toHaveTextContent("other-private-token");
  window.sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify({
    orderId: "DEMO-ROUTE", accessSecret: "matching-private-token", status: "confirmed",
  }));
  unmount();
  render(<DemoCheckoutSuccessPage orderId="DEMO-ROUTE" status="confirmed" />);
  await waitFor(() => expect(screen.queryByText(/此分頁沒有完整查單憑證/)).not.toBeInTheDocument());
  expect(screen.getByText("訂單編號：DEMO-ROUTE")).toBeInTheDocument();
  expect(document.body).not.toHaveTextContent("matching-private-token");
});
