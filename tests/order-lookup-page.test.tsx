import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { demoApi, type DemoLookup } from "@/features/demo/demo-api";
import { OrderLookupPage } from "@/features/demo/components/order-lookup-page";
import { demoCheckoutSuccessStorageKey } from "@/features/demo/components/demo-checkout-success-page";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("order=DEMO-12345678-1234-1234-1234-123456789abc") }));
afterEach(() => { window.sessionStorage.clear(); vi.restoreAllMocks(); });

it("prioritizes customer name and last three digits while keeping saved order token out of the visible primary form", () => {
  window.sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify({
    orderId: "DEMO-12345678-1234-1234-1234-123456789abc", accessSecret: "test-secret",
    customerName: "測試顧客", phone: "0912000000",
  }));
  render(<OrderLookupPage />);
  expect(screen.getByLabelText("顧客姓名")).toHaveValue("測試顧客");
  expect(screen.getByLabelText("手機末三碼")).toHaveValue("000");
  expect(screen.getByText("已帶入這個分頁剛才的訂單資料，不必複製查單憑證。")).toBeInTheDocument();
  expect(screen.getByText("其他裝置查單／進階資訊")).toBeInTheDocument();
  expect(screen.getByLabelText("查單憑證")).toHaveAttribute("type", "password");
  expect(screen.getByLabelText("查單憑證")).toHaveValue("test-secret");
  expect(screen.getByRole("button", { name: "取得查單驗證碼" })).toBeInTheDocument();
  expect(document.body.textContent).not.toContain("test-secret");
  expect(screen.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/");
});

it("offers a home link after a successful verified lookup", async () => {
  window.sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify({
    orderId: "DEMO-12345678-1234-1234-1234-123456789abc", accessSecret: "test-secret",
    customerName: "測試顧客", phone: "0912000000",
  }));
  vi.spyOn(demoApi, "issueOtp").mockResolvedValue({ challengeId: "challenge", expiresAt: "", demoCode: "123456" });
  vi.spyOn(demoApi, "lookup").mockResolvedValue({
    order: { status: "confirmed", paymentStatus: "pending" },
    notifications: [],
    mobilePushPreview: { title: "茶品訂單已成立", body: "示範訂單", state: "preview-only" },
  } as unknown as DemoLookup);
  render(<OrderLookupPage />);
  fireEvent.click(screen.getByRole("button", { name: "取得查單驗證碼" }));
  await screen.findByText("本機驗證碼：", { exact: false });
  fireEvent.change(screen.getByLabelText("驗證碼"), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "查詢訂單" }));
  await waitFor(() => expect(screen.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/"));
});

it("blocks OTP before a missing order credential is restored, without a request", () => {
  const issue = vi.spyOn(demoApi, "issueOtp");
  render(<OrderLookupPage />);
  expect(screen.getByText(/目前尚無完整查單憑證/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/");
  const button = screen.getByRole("button", { name: "取得查單驗證碼" });
  expect(button).toBeDisabled();
  expect(issue).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("查單憑證"), { target: { value: "self-saved-test-secret" } });
  expect(button).toBeEnabled();
  expect(issue).not.toHaveBeenCalled();
});
