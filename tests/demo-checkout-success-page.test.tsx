import { render, screen } from "@testing-library/react";
import { DemoCheckoutSuccessPage } from "@/features/demo/components/demo-checkout-success-page";

it("shows an independent order success page without exposing the lookup token", () => {
  render(<DemoCheckoutSuccessPage orderId="DEMO-123" accessSecret="secret-token" status="confirmed" />);

  expect(screen.getByRole("heading", { name: "感謝您的購買" })).toBeInTheDocument();
  expect(screen.getByText("訂單編號：DEMO-123")).toBeInTheDocument();
  expect(screen.getByText("已收到您的示範訂單，店家將依序處理。")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "主動查看訂單" })).toHaveAttribute("href", "/orders?order=DEMO-123");
  expect(document.body).not.toHaveTextContent("secret-token");
});
