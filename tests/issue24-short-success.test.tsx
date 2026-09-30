import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, test, expect } from "vitest";
import { DemoCheckoutSuccessPage, demoCheckoutSuccessStorageKey } from "@/features/demo/components/demo-checkout-success-page";
afterEach(() => window.sessionStorage.clear());
test("shows short public number while retaining the private receipt", async () => {
  const internal = "DEMO-00000000-0000-0000-0000-000000000001";
  window.sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify({
    orderId: internal, orderNumber: "260930-001", accessSecret: "private-secret", status: "confirmed"
  }));
  render(<DemoCheckoutSuccessPage orderId={internal} status="confirmed" />);
  await waitFor(() => expect(screen.getByText("訂單編號：260930-001")).toBeInTheDocument());
  expect(screen.getByRole("link", {name: "主動查看訂單"})).toHaveAttribute("href", "/orders?order=260930-001");
  expect(document.body).not.toHaveTextContent(internal);
  expect(document.body).not.toHaveTextContent("private-secret");
});

test("copies only the public short number with one tap", async () => {
  const { fireEvent } = await import("@testing-library/react");
  const { vi } = await import("vitest");
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(<DemoCheckoutSuccessPage orderId="DEMO-private" orderNumber="260930-002" accessSecret="private-secret" status="confirmed" />);
  fireEvent.click(screen.getByRole("button", { name: "複製訂單編號" }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith("260930-002"));
  expect(screen.getByRole("status")).toHaveTextContent("已複製");
  expect(writeText).not.toHaveBeenCalledWith("DEMO-private");
});
