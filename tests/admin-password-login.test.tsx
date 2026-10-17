import { beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdminOrdersPage } from "@/features/demo/components/admin-orders-page";
import { demoApi } from "@/features/demo/demo-api";
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(demoApi, "merchantStatus").mockResolvedValue({ provider: "password", state: "ready", simulated: false });
  vi.spyOn(demoApi, "merchantPasswordLogin").mockResolvedValue({ authenticated: true });
  vi.spyOn(demoApi, "adminOrders").mockResolvedValue([]);
});
test("password provider offers one password field and resumes same merchant orders", async () => {
  render(<AdminOrdersPage />);
  const input = await screen.findByLabelText("管理員密碼");
  expect(input).toHaveAttribute("type", "password");
  expect(screen.queryByLabelText("已綁定手機")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "登入" })).toBeDisabled();
  fireEvent.change(input, { target: { value: "synthetic-password" } });
  fireEvent.click(screen.getByRole("button", { name: "登入" }));
  await screen.findByText("目前沒有示範訂單。");
  expect(demoApi.merchantPasswordLogin).toHaveBeenCalledWith("synthetic-password");
  expect(demoApi.adminOrders).toHaveBeenCalled();
  expect(screen.queryByText("synthetic-password")).not.toBeInTheDocument();
});
test("failed password clears the field and pending configuration cannot login", async () => {
  vi.mocked(demoApi.merchantPasswordLogin).mockRejectedValue(new Error("登入失敗，請稍後重試。"));
  render(<AdminOrdersPage />);
  const input = await screen.findByLabelText("管理員密碼");
  fireEvent.change(input, { target: { value: "wrong-password" } });
  fireEvent.click(screen.getByRole("button", { name: "登入" }));
  await screen.findByRole("alert");
  expect(input).toHaveValue("");
  expect(demoApi.adminOrders).not.toHaveBeenCalled();
});
test("password-pending fails closed in the interface", async () => {
  vi.mocked(demoApi.merchantStatus).mockResolvedValue({ provider: "password", state: "password-pending", simulated: false });
  render(<AdminOrdersPage />);
  fireEvent.change(await screen.findByLabelText("管理員密碼"), { target: { value: "synthetic-password" } });
  expect(screen.getByRole("button", { name: "登入" })).toBeDisabled();
  expect(demoApi.merchantPasswordLogin).not.toHaveBeenCalled();
});
