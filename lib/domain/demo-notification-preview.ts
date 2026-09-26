import type { DemoOrderStatus } from "./demo-order-service";

export type DemoMobilePushPreview = {
  channel: "simulated-mobile-push";
  state: "preview-only";
  title: string;
  body: string;
};

const copy: Record<DemoOrderStatus, { title: string; message: string }> = {
  confirmed: { title: "茶品訂單已成立", message: "已建立" },
  packed: { title: "茶品訂單已完成包裝", message: "已由店家完成包裝，等待人工確認出貨" },
  shipped: { title: "茶品訂單已出貨", message: "已由店家人工確認出貨" },
  delivered: { title: "茶品訂單已送達", message: "已在示範流程中標記送達" },
};

/** Payload preview only: never registers a service worker or contacts a push provider. */
export function createDemoMobilePushPreview(orderId: string, status: DemoOrderStatus): DemoMobilePushPreview {
  const selected = copy[status];
  return {
    channel: "simulated-mobile-push",
    state: "preview-only",
    title: selected.title,
    body: `示範訂單 ${orderId} ${selected.message}。`,
  };
}
