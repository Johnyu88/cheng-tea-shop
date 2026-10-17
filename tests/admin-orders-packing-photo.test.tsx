import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminOrdersPage } from "@/features/demo/components/admin-orders-page";
import { demoApi, type DemoAdminOrder } from "@/features/demo/demo-api";

const order: DemoAdminOrder = {
  order: {
    orderId: "DEMO-00000000-0000-0000-0000-000000000001",
    status: "confirmed",
    paymentMethod: "bank-transfer",
    paymentStatus: "manual-confirmed",
    lines: [],
    total: { currency: "TWD", amount: 300 },
    packingPhotoId: null,
    events: [{ status: "confirmed", at: "2026-09-30T00:00:00.000Z" }],
  },
  notifications: [],
};

const login = async () => {
  fireEvent.change(screen.getByLabelText("已綁定手機"), { target: { value: "0912000000" } });
  await waitFor(() => expect(screen.getByRole("button", { name: "傳送驗證碼" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "傳送驗證碼" }));
  fireEvent.change(await screen.findByLabelText("六位數驗證碼"), { target: { value: "001234" } });
  fireEvent.click(screen.getByRole("button", { name: "驗證並登入" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "已確認" })).toBeInTheDocument());
};

describe("admin packing photo confirmation flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(demoApi, "merchantStatus").mockResolvedValue({ state: "ready", simulated: true });
    vi.spyOn(demoApi, "merchantIssueOtp").mockResolvedValue({ challengeId: "a".repeat(32), expiresInSeconds: 300, resendAfterSeconds: 60, simulated: true });
    vi.spyOn(demoApi, "merchantPhoneLogin").mockResolvedValue({ authenticated: true });
    vi.spyOn(demoApi, "adminOrders").mockResolvedValue([order]);
    vi.spyOn(demoApi, "packingPhoto").mockResolvedValue({});
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:packing-preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  test("offers camera and gallery, previews a selection, and waits for explicit confirmation", async () => {
    render(<AdminOrdersPage />);
    await login();

    const camera = screen.getByLabelText("開啟相機");
    const gallery = screen.getByLabelText("選擇相簿");
    expect(camera).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    expect(camera).toHaveAttribute("capture", "environment");
    expect(gallery).not.toHaveAttribute("capture");

    const file = new File(["jpeg"], "packing.jpg", { type: "image/jpeg" });
    fireEvent.change(gallery, { target: { files: [file] } });
    expect(screen.getByRole("img", { name: "包裝照片預覽" })).toHaveAttribute("src", "blob:packing-preview");
    expect(screen.getByRole("button", { name: "確認包裝" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "已確認" })).toBeInTheDocument();
    expect(demoApi.packingPhoto).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(screen.queryByRole("img", { name: "包裝照片預覽" })).not.toBeInTheDocument();
    expect(demoApi.packingPhoto).not.toHaveBeenCalled();
  });

  test("reselects a photo and keeps the preview when upload fails", async () => {
    vi.mocked(demoApi.packingPhoto).mockRejectedValueOnce(new Error("網路錯誤"));
    render(<AdminOrdersPage />);
    await login();
    const gallery = screen.getByLabelText("選擇相簿");
    fireEvent.change(gallery, { target: { files: [new File(["one"], "one.jpg", { type: "image/jpeg" })] } });
    fireEvent.click(screen.getByText("重選照片"));
    fireEvent.change(gallery, { target: { files: [new File(["two"], "two.jpg", { type: "image/png" })] } });
    expect(screen.getByText("two.jpg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "確認包裝" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("網路錯誤"));
    expect(screen.getByRole("img", { name: "包裝照片預覽" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "確認包裝" })).toBeInTheDocument();
  });

  test("refreshes only after a successful confirmed upload", async () => {
    vi.mocked(demoApi.adminOrders)
      .mockResolvedValueOnce([order])
      .mockResolvedValueOnce([{ ...order, order: { ...order.order, status: "packed", packingPhotoId: "photo-confirmed" } }]);
    render(<AdminOrdersPage />);
    await login();
    fireEvent.change(screen.getByLabelText("開啟相機"), { target: { files: [new File(["jpeg"], "packing.jpg", { type: "image/jpeg" })] } });
    fireEvent.click(screen.getByRole("button", { name: "確認包裝" }));
    await waitFor(() => expect(demoApi.packingPhoto).toHaveBeenCalledWith(order.order.orderId, expect.any(File)));
    expect(demoApi.adminOrders).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.getByRole("heading", { name: "已打包" })).toBeInTheDocument());
  });
});
