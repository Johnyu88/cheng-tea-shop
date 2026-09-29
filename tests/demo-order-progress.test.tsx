import { render, screen, within } from "@testing-library/react";
import { DemoOrderProgress } from "@/features/demo/components/demo-order-progress";
import type { DemoOrderSnapshot } from "@/lib/domain/demo-order-service";
const order = (status: DemoOrderSnapshot["status"], paymentStatus: DemoOrderSnapshot["paymentStatus"], photo: string | null) =>
  ({ status, paymentStatus, packingPhotoId: photo });
it("does not mark future steps complete for a newly confirmed order", () => {
  render(<DemoOrderProgress order={order("confirmed", "pending-manual-verification", null)} />);
  const progress = screen.getByRole("region", { name: "訂單處理進度" });
  expect(within(progress).getAllByText("已完成")).toHaveLength(1);
  expect(within(progress).getAllByText("未完成")).toHaveLength(4);
});
it("distinguishes shipped from delivered and requires the packing photo", () => {
  const { rerender } = render(<DemoOrderProgress order={order("shipped", "manual-confirmed", "photo-demo")} />);
  const progress = screen.getByRole("region", { name: "訂單處理進度" });
  expect(within(progress).getAllByText("已完成")).toHaveLength(4);
  expect(within(progress).getAllByText("未完成")).toHaveLength(1);
  rerender(<DemoOrderProgress order={order("delivered", "manual-confirmed", "photo-demo")} />);
  expect(within(progress).getAllByText("已完成")).toHaveLength(5);
  expect(within(progress).queryByText("未完成")).not.toBeInTheDocument();
});
it("never claims real payment, shipping or delivery", () => {
  render(<DemoOrderProgress order={order("confirmed", "pending-manual-verification", null)} />);
  expect(screen.getByText(/不代表實際收款、物流配送或通知送達/)).toBeInTheDocument();
});
