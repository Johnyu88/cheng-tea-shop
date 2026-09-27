import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderLookupPage } from "@/features/demo/components/order-lookup-page";
import { demoCheckoutSuccessStorageKey } from "@/features/demo/components/demo-checkout-success-page";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("order=DEMO-12345678-1234-1234-1234-123456789abc") }));
afterEach(() => window.sessionStorage.clear());

it("prioritizes customer name and last three digits while keeping saved order token out of the visible primary form", () => {
  window.sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify({
    orderId: "DEMO-12345678-1234-1234-1234-123456789abc", accessSecret: "test-secret",
    customerName: "測試顧客", phone: "0912000000",
  }));
  render(<OrderLookupPage />);
  expect(screen.getByLabelText("顧客姓名")).toHaveValue("測試顧客");
  expect(screen.getByLabelText("手機末三碼")).toHaveValue("000");
  expect(screen.getByText("已帶入剛才的訂單資料，不必複製查單 token。")).toBeInTheDocument();
  expect(screen.getByText("其他裝置查單／進階資訊")).toBeInTheDocument();
  expect(screen.getByLabelText("查單憑證")).toHaveAttribute("type", "password");
  expect(screen.getByLabelText("查單憑證")).toHaveValue("test-secret");
  expect(screen.getByRole("button", { name: "取得查單驗證碼" })).toBeInTheDocument();
  expect(document.body.textContent).not.toContain("test-secret");
});
