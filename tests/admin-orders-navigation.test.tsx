import { expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdminOrdersPage } from "@/features/demo/components/admin-orders-page";

it("provides a clear home link without logging in or modifying an order", () => {
  render(<AdminOrdersPage />);
  expect(screen.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("button", { name: "確認店家身分" })).toBeInTheDocument();
});

it("shows and hides the local demo password without submitting or changing it", () => {
  render(<AdminOrdersPage />);
  const field = screen.getByLabelText("獨立店家 Demo 密碼");
  fireEvent.change(field, { target: { value: "sample-not-a-real-secret" } });
  expect(field).toHaveAttribute("type", "password");
  fireEvent.click(screen.getByRole("button", { name: "顯示密碼" }));
  expect(field).toHaveAttribute("type", "text");
  expect(field).toHaveValue("sample-not-a-real-secret");
  fireEvent.click(screen.getByRole("button", { name: "隱藏密碼" }));
  expect(field).toHaveAttribute("type", "password");
});


it("shows only credential length and ignores pasted outer whitespace without exposing value", () => {
  render(<AdminOrdersPage />);
  const field = screen.getByLabelText("獨立店家 Demo 密碼");
  const submit = screen.getByRole("button", { name: "確認店家身分" });
  expect(submit).toBeDisabled();
  fireEvent.change(field, { target: { value: " " + "a".repeat(64) + "\n" } });
  expect(screen.getByText(/64\/64 個字元/)).toBeInTheDocument();
  expect(screen.getByText(/已忽略前後空白/)).toBeInTheDocument();
  expect(submit).toBeEnabled();
});


it("explains a 64-character non-hex paste and allows clearing it safely", () => {
  render(<AdminOrdersPage />);
  const field = screen.getByLabelText("獨立店家 Demo 密碼");
  const submit = screen.getByRole("button", { name: "確認店家身分" });
  fireEvent.change(field, { target: { value: "g" + "a".repeat(63) } });
  expect(screen.getByText(/含 1 個非 0–9、a–f 字元/)).toBeInTheDocument();
  expect(submit).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "清空重貼" }));
  expect(field).toHaveValue("");
  expect(field).toHaveAttribute("type", "password");
});
