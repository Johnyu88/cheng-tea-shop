import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { demoApi } from "@/features/demo/demo-api";
import { AdminOrdersPage } from "@/features/demo/components/admin-orders-page";
afterEach(() => vi.restoreAllMocks());
it("makes Passkey the main login and hides emergency password behind an explicit fallback", async () => {
  vi.spyOn(demoApi, "merchantStatus").mockResolvedValue({
    provider:"password", state:"ready", simulated:false, authenticated:false,
    passkey:{enabled:true,registered:true},
  } as Awaited<ReturnType<typeof demoApi.merchantStatus>>);
  render(<AdminOrdersPage />);
  expect(await screen.findByRole("button",{name:"使用 Face ID／Passkey 登入"})).toBeEnabled();
  expect(screen.queryByLabelText("Demo 密碼")).not.toBeInTheDocument();
});
import { fireEvent, waitFor } from "@testing-library/react";
import { merchantPasskeyClient } from "@/features/demo/merchant-passkey-client";
vi.mock("@/features/demo/merchant-passkey-client", () => ({ merchantPasskeyClient:{
  signIn:{passkey:vi.fn()}, passkey:{addPasskey:vi.fn()},
}}));
it("registers after one-time authorization and enters orders without a second login", async () => {
  vi.spyOn(demoApi,"merchantStatus").mockResolvedValueOnce({provider:"password",state:"ready",simulated:false,passkey:{enabled:true,registered:false}}).mockResolvedValue({provider:"password",state:"ready",simulated:false,authenticated:true,passkey:{enabled:true,registered:true}});
  vi.spyOn(demoApi,"merchantPasskeyEnroll").mockResolvedValue({authenticated:true});
  vi.spyOn(demoApi,"adminOrders").mockResolvedValue([]);
  vi.mocked(merchantPasskeyClient.passkey.addPasskey).mockResolvedValue({data:{},error:null} as never);
  render(<AdminOrdersPage/>);
  fireEvent.change(await screen.findByLabelText("首次設定密碼"),{target:{value:"synthetic-password"}});
  fireEvent.click(screen.getByRole("button",{name:"設定這支手機的 Passkey"}));
  await screen.findByText("目前沒有示範訂單。");
  expect(screen.queryByLabelText("首次設定密碼")).not.toBeInTheDocument();
  expect(screen.getByRole("button",{name:"登出"})).toBeEnabled();
});
it("uses Passkey then restores the authorized orders directly", async () => {
  vi.spyOn(demoApi,"merchantStatus").mockResolvedValueOnce({provider:"password",state:"ready",simulated:false,passkey:{enabled:true,registered:true}}).mockResolvedValue({provider:"password",state:"ready",simulated:false,authenticated:true,passkey:{enabled:true,registered:true}});
  vi.spyOn(demoApi,"adminOrders").mockResolvedValue([]);
  vi.mocked(merchantPasskeyClient.signIn.passkey).mockResolvedValue({data:{},error:null} as never);
  render(<AdminOrdersPage/>);
  fireEvent.click(await screen.findByRole("button",{name:"使用 Face ID／Passkey 登入"}));
  await screen.findByText("目前沒有示範訂單。");
});
it("shows cancelled authentication and does not reveal orders", async () => {
  vi.spyOn(demoApi,"merchantStatus").mockResolvedValue({provider:"password",state:"ready",simulated:false,passkey:{enabled:true,registered:true}});
  vi.mocked(merchantPasskeyClient.signIn.passkey).mockResolvedValue({data:null,error:{message:"cancelled"}} as never);
  render(<AdminOrdersPage/>);
  fireEvent.click(await screen.findByRole("button",{name:"使用 Face ID／Passkey 登入"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Passkey 登入未完成");
  expect(screen.queryByText("目前沒有示範訂單。")).not.toBeInTheDocument();
});
it("clears sensitive order views after confirmed logout", async () => {
  vi.spyOn(demoApi,"merchantStatus").mockResolvedValueOnce({provider:"password",state:"ready",simulated:false,authenticated:true,passkey:{enabled:true,registered:true}}).mockResolvedValue({provider:"password",state:"ready",simulated:false,authenticated:false,passkey:{enabled:true,registered:true}});
  vi.spyOn(demoApi,"adminOrders").mockResolvedValue([]);
  vi.spyOn(demoApi,"merchantLogout").mockResolvedValue({authenticated:false});
  render(<AdminOrdersPage/>);
  fireEvent.click(await screen.findByRole("button",{name:"登出"}));
  await waitFor(()=>expect(screen.queryByText("目前沒有示範訂單。")).not.toBeInTheDocument());
  await screen.findByRole("button",{name:"使用 Face ID／Passkey 登入"});
});

