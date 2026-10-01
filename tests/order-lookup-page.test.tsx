import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { demoApi, type DemoLookup } from "@/features/demo/demo-api";
import { OrderLookupPage } from "@/features/demo/components/order-lookup-page";
import { demoCheckoutSuccessStorageKey } from "@/features/demo/components/demo-checkout-success-page";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("order=DEMO-12345678-1234-1234-1234-123456789abc") }));
afterEach(() => { window.sessionStorage.clear(); vi.restoreAllMocks(); });
const receipt = { orderId: "DEMO-12345678-1234-1234-1234-123456789abc", accessSecret: "test-secret", customerName: "測試顧客", phone: "0912000000" };
it("restores convenience identity fields without rendering or requiring the saved secret", async () => {
  sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify(receipt));
  render(<OrderLookupPage />);
  await waitFor(() => expect(screen.getByLabelText("顧客姓名")).toHaveValue("測試顧客"));
  expect(screen.getByLabelText("手機末三碼")).toHaveValue("000");
  expect(screen.queryByLabelText("查單憑證")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("驗證用手機")).not.toBeInTheDocument();
  expect(document.body.textContent).not.toContain("test-secret");
  expect(screen.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/");
});
it("shows a delivered order after verified lookup without passing a credential", async () => {
  sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify(receipt));
  vi.spyOn(demoApi, "issueLookupOtp").mockResolvedValue({ challengeId: "challenge", expiresAt: "", demoCode: "123456" });
  const lookup = vi.spyOn(demoApi, "lookup").mockResolvedValue({
    order: { status: "delivered", paymentStatus: "manual-confirmed", paymentMethod: "cash", deliveryStatus: "delivered" },
    notifications: [], mobilePushPreview: { title: "", body: "", state: "preview-only" },
  } as unknown as DemoLookup);
  render(<OrderLookupPage />);
  await waitFor(() => expect(screen.getByRole("button", { name: "取得查單驗證碼" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "取得查單驗證碼" }));
  await screen.findByLabelText("驗證碼");
  fireEvent.change(screen.getByLabelText("驗證碼"), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "查詢訂單" }));
  await screen.findByRole("heading", { name: "已送達" });
  expect(lookup).toHaveBeenCalledWith({ orderId: receipt.orderId, customerName: receipt.customerName, phoneLastThree: "000", challengeId: "challenge", code: "123456" });
});
it("blocks incomplete identity before requesting OTP", () => {
  const issue = vi.spyOn(demoApi, "issueLookupOtp");
  render(<OrderLookupPage />);
  expect(screen.getByRole("button", { name: "取得查單驗證碼" })).toBeDisabled();
  expect(issue).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("驗證碼")).not.toBeInTheDocument();
});
it("restores matching tab data without requiring a saved credential or bypassing OTP", () => {
  render(<OrderLookupPage />);
  sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify({ ...receipt, accessSecret: undefined }));
  fireEvent.click(screen.getByRole("button", { name: "重新載入本分頁訂單資料" }));
  expect(screen.getByLabelText("顧客姓名")).toHaveValue(receipt.customerName);
  expect(screen.getByRole("button", { name: "取得查單驗證碼" })).toBeEnabled();
  expect(screen.queryByRole("heading", { name: "已送達" })).not.toBeInTheDocument();
});
it("supports manual cross-device entry when no tab receipt exists", () => {
  render(<OrderLookupPage />);
  fireEvent.click(screen.getByRole("button", { name: "重新載入本分頁訂單資料" }));
  expect(screen.getByText(/可在任何裝置查單/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("顧客姓名"), { target: { value: "Yu" } });
  fireEvent.change(screen.getByLabelText("手機末三碼"), { target: { value: "000" } });
  expect(screen.getByRole("button", { name: "取得查單驗證碼" })).toBeEnabled();
});
it("hydrates without a server/client mismatch", async () => {
  const container = document.createElement("div");
  container.innerHTML = renderToString(<OrderLookupPage />); document.body.appendChild(container);
  sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify(receipt));
  const errors: unknown[][] = [];
  const consoleError = vi.spyOn(console, "error").mockImplementation((...args) => { errors.push(args); });
  const root = hydrateRoot(container, <OrderLookupPage />);
  await waitFor(() => expect(container.textContent).toContain("已帶入這個分頁剛才的訂單資料"));
  expect(errors.some(args => args.some(arg => String(arg).includes("Hydration failed")))).toBe(false);
  root.unmount(); consoleError.mockRestore(); container.remove();
});
