import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { demoApi } from "@/features/demo/demo-api";
import { OrderLookupPage } from "@/features/demo/components/order-lookup-page";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
afterEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });
function fill() {
  fireEvent.change(screen.getByLabelText("訂單編號"), { target: { value: "261002-006" } });
  fireEvent.change(screen.getByLabelText("顧客姓名"), { target: { value: "手機查單" } });
  fireEvent.change(screen.getByLabelText("手機末三碼"), { target: { value: "000" } });
}
it("switches immediately to step two with OTP, expiry and explicit resend cooldown", async () => {
  vi.spyOn(demoApi, "issueLookupOtp").mockResolvedValue({ challengeId: "stage", expiresAt: String(Date.now() + 300000), demoCode: "123456" });
  render(<OrderLookupPage />); fill();
  fireEvent.click(screen.getByRole("button", { name: "取得查單驗證碼" }));
  await screen.findByRole("heading", { name: "第二步：驗證並查詢訂單" });
  expect(screen.getByLabelText("驗證碼")).toBeInTheDocument();
  expect(screen.getByText(/OTP 有效時間/)).toBeInTheDocument();
  expect(screen.getByText(/本機驗證碼/)).toHaveTextContent("123456");
  expect(screen.getByRole("button", { name: /重新取得.*秒/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: "查詢訂單" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "修改查單資料" }));
  await waitFor(() => expect(screen.queryByLabelText("驗證碼")).not.toBeInTheDocument());
});
it("shows required-field feedback instead of a silent disabled button", () => {
  render(<OrderLookupPage />);
  fireEvent.click(screen.getByRole("button", { name: "取得查單驗證碼" }));
  expect(screen.getByRole("alert")).toHaveTextContent("請完整填入");
});
it("announces a pending request and displays network failure in place", async () => {
  let reject!: (e: Error) => void;
  vi.spyOn(demoApi, "issueLookupOtp").mockReturnValue(new Promise((_r, fail) => { reject = fail; }));
  render(<OrderLookupPage />); fill(); fireEvent.click(screen.getByRole("button", { name: "取得查單驗證碼" }));
  expect(screen.getByRole("status")).toHaveTextContent("正在取得驗證碼");
  reject(new Error("連線逾時，請重試"));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("連線逾時"));
  expect(screen.queryByLabelText("驗證碼")).not.toBeInTheDocument();
});
it("shows generic no-match feedback after OTP without hiding the second step", async () => {
  vi.spyOn(demoApi, "issueLookupOtp").mockResolvedValue({ challengeId: "decoy", expiresAt: Date.now() + 300000, demoCode: "123456" });
  vi.spyOn(demoApi, "lookup").mockRejectedValue(new Error("查無符合資料的訂單，或驗證碼無效／過期"));
  render(<OrderLookupPage />); fill(); fireEvent.click(screen.getByRole("button", { name: "取得查單驗證碼" }));
  await screen.findByLabelText("驗證碼");
  fireEvent.change(screen.getByLabelText("驗證碼"), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "查詢訂單" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("查無符合資料"));
  expect(screen.getByRole("heading", { name: "第二步：驗證並查詢訂單" })).toBeInTheDocument();
});
it("shows an exact rate-limit countdown", async () => {
  const { DemoApiError } = await import("@/features/demo/demo-api");
  vi.spyOn(demoApi, "issueLookupOtp").mockRejectedValue(new DemoApiError("限流", 429, 87));
  render(<OrderLookupPage />); fill(); fireEvent.click(screen.getByRole("button", { name: "取得查單驗證碼" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("87 秒"));
  expect(screen.getByRole("button", { name: /冷卻中，請等待 87 秒/ })).toBeDisabled();
});
it("shows consumed and expired challenge state with a cooldown", async () => {
  vi.spyOn(demoApi, "issueLookupOtp").mockResolvedValue({ challengeId: "used", expiresAt: Date.now() - 1, resendAvailableAt: Date.now() + 50000, usable: false, demoCode: "123456" });
  render(<OrderLookupPage />); fill(); fireEvent.click(screen.getByRole("button", { name: "取得查單驗證碼" }));
  await screen.findByLabelText("驗證碼");
  expect(screen.getByText(/OTP 有效時間/)).toHaveTextContent("已過期");
  expect(screen.getByRole("button", { name: "查詢訂單" })).toBeDisabled();
  expect(screen.getByRole("button", { name: /重新取得驗證碼（冷卻/ })).toBeDisabled();
});

