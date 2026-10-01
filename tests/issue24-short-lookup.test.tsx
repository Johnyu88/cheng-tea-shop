import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, test, expect, vi } from "vitest";
import { OrderLookupPage } from "@/features/demo/components/order-lookup-page";
import { demoApi } from "@/features/demo/demo-api";
import { demoCheckoutSuccessStorageKey } from "@/features/demo/components/demo-checkout-success-page";
vi.mock("next/navigation",()=>({useSearchParams:()=>new URLSearchParams("order=260930-001")}));
afterEach(()=>{window.sessionStorage.clear();vi.restoreAllMocks();});
test("restores private UUID receipt from short number URL and verifies before lookup",async()=>{
  window.sessionStorage.setItem(demoCheckoutSuccessStorageKey,JSON.stringify({
    orderId:"DEMO-00000000-0000-0000-0000-000000000001",orderNumber:"260930-001",
    accessSecret:"private-receipt",customerName:"Yu",phone:"0912000000"
  }));
  vi.spyOn(demoApi,"issueLookupOtp").mockResolvedValue({challengeId:"challenge",expiresAt:"",demoCode:"123456"});
  const lookup=vi.spyOn(demoApi,"lookup").mockRejectedValue(new Error("generic verification failure"));
  render(<OrderLookupPage/>);
  await waitFor(()=>expect(screen.getByLabelText("顧客姓名")).toHaveValue("Yu"));
  expect(screen.getByLabelText("訂單編號")).toHaveValue("260930-001");
  expect(lookup).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"取得查單驗證碼"}));
  await screen.findByText("本機驗證碼：",{exact:false});
  fireEvent.change(screen.getByLabelText("驗證碼"),{target:{value:"123456"}});
  fireEvent.click(screen.getByRole("button",{name:"查詢訂單"}));
  await waitFor(()=>expect(lookup).toHaveBeenCalledWith(expect.objectContaining({orderId:"260930-001",customerName:"Yu",phoneLastThree:"000"})));
  expect(document.body.textContent).not.toContain("private-receipt");
});
