import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { demoApi } from "@/features/demo/demo-api";
import { AdminOrdersPage } from "@/features/demo/components/admin-orders-page";

afterEach(() => vi.restoreAllMocks());

const ready = { provider: "password" as const, state: "ready" as const, simulated: false, authenticated: false, passkey: { enabled: false, registered: false } };

it("uses the existing administrator password and does not expose Passkey or SMS login", async () => {
  vi.spyOn(demoApi, "merchantStatus").mockResolvedValue(ready);
  render(<AdminOrdersPage />);
  expect(await screen.findByLabelText("管理員密碼")).toBeInTheDocument();
  expect(screen.queryByText(/Passkey|簡訊|手機驗證/)).not.toBeInTheDocument();
});

it("logs in with the administrator password and loads orders", async () => {
  vi.spyOn(demoApi, "merchantStatus").mockResolvedValue(ready);
  vi.spyOn(demoApi, "merchantPasswordLogin").mockResolvedValue({ authenticated: true });
  vi.spyOn(demoApi, "adminOrders").mockResolvedValue([]);
  render(<AdminOrdersPage />);
  fireEvent.change(await screen.findByLabelText("管理員密碼"), { target: { value: "existing-password" } });
  fireEvent.click(screen.getByRole("button", { name: "登入" }));
  await screen.findByText("目前沒有示範訂單。");
  expect(demoApi.merchantPasswordLogin).toHaveBeenCalledWith("existing-password");
  expect(screen.getByRole("button", { name: "登出" })).toBeEnabled();
});

it("does not reveal orders after a failed password login", async () => {
  vi.spyOn(demoApi, "merchantStatus").mockResolvedValue(ready);
  vi.spyOn(demoApi, "merchantPasswordLogin").mockRejectedValue(new Error("登入失敗"));
  render(<AdminOrdersPage />);
  fireEvent.change(await screen.findByLabelText("管理員密碼"), { target: { value: "wrong-password" } });
  fireEvent.click(screen.getByRole("button", { name: "登入" }));
  await screen.findByRole("alert");
  expect(screen.queryByText("目前沒有示範訂單。")).not.toBeInTheDocument();
});

it("keeps the password submit action disabled until a password is entered", async () => {
  vi.spyOn(demoApi, "merchantStatus").mockResolvedValue(ready);
  render(<AdminOrdersPage />);
  await screen.findByLabelText("管理員密碼");
  expect(screen.getByRole("button", { name: "登入" })).toBeDisabled();
});

it("clears the protected order view after logout", async () => {
  vi.spyOn(demoApi, "merchantStatus").mockResolvedValueOnce({ ...ready, authenticated: true }).mockResolvedValue({ ...ready, authenticated: false });
  vi.spyOn(demoApi, "adminOrders").mockResolvedValue([]);
  vi.spyOn(demoApi, "merchantLogout").mockResolvedValue({ authenticated: false });
  render(<AdminOrdersPage />);
  await screen.findByText("目前沒有示範訂單。");
  fireEvent.click(screen.getByRole("button", { name: "登出" }));
  await waitFor(() => expect(screen.queryByText("目前沒有示範訂單。")).not.toBeInTheDocument());
  expect(await screen.findByLabelText("管理員密碼")).toBeInTheDocument();
});
