import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminOrdersPage } from "@/features/demo/components/admin-orders-page";
import { demoApi } from "@/features/demo/demo-api";
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(demoApi, "merchantStatus").mockResolvedValue({ state: "ready", simulated: true });
  vi.spyOn(demoApi, "merchantIssueOtp").mockResolvedValue({
    challengeId: "a".repeat(32), expiresInSeconds: 300, resendAfterSeconds: 60, simulated: true,
  });
  vi.spyOn(demoApi, "merchantPhoneLogin").mockResolvedValue({ authenticated: true });
  vi.spyOn(demoApi, "adminOrders").mockResolvedValue([]);
});
it("provides a clear home link and replaces human credential entry with phone verification", async () => {
  render(<AdminOrdersPage />);
  expect(screen.getByRole("link", { name: "回到首頁" })).toHaveAttribute("href", "/");
  expect(screen.queryByLabelText("商家 Demo 憑證")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("已綁定手機"), { target: { value: "0912000000" } });
  await waitFor(() => expect(screen.getByRole("button", { name: "傳送驗證碼" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "傳送驗證碼" }));
  const code = await screen.findByLabelText("六位數驗證碼");
  expect(code).toHaveAttribute("autoComplete", "one-time-code");
  expect(screen.getByRole("button", { name: "重新傳送（60 秒）" })).toBeDisabled();
  fireEvent.change(code, { target: { value: "001234" } });
  fireEvent.click(screen.getByRole("button", { name: "驗證並登入" }));
  await screen.findByText("目前沒有示範訂單。");
  expect(demoApi.merchantPhoneLogin).toHaveBeenCalledWith({
    phone: "0912000000", challengeId: "a".repeat(32), code: "001234",
  });
  expect(screen.queryByText("001234")).not.toBeInTheDocument();
});
it("shows pending teacher binding and disables issuing codes", async () => {
  vi.mocked(demoApi.merchantStatus).mockResolvedValue({ state: "binding-pending", simulated: false });
  render(<AdminOrdersPage />);
  await screen.findByText(/尚未完成陳老師本人確認與手機綁定/);
  fireEvent.change(screen.getByLabelText("已綁定手機"), { target: { value: "0912000000" } });
  expect(screen.getByRole("button", { name: "傳送驗證碼" })).toBeDisabled();
  expect(demoApi.merchantIssueOtp).not.toHaveBeenCalled();
});
it("shows simulated SMS plainly and never displays its operator code", async () => {
  render(<AdminOrdersPage />);
  await screen.findByText(/模擬簡訊/);
  expect(screen.queryByText(/demoCode/)).not.toBeInTheDocument();
});
