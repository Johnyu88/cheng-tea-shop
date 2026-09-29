import type { DemoOrderSnapshot } from "@/lib/domain/demo-order-service";
import styles from "./demo-order-progress.module.css";

type Progress = Pick<DemoOrderSnapshot, "status" | "paymentStatus" | "packingPhotoId">;

export function DemoOrderProgress({ order }: { order: Progress }) {
  const packed = order.status === "packed" || order.status === "shipped" || order.status === "delivered";
  const shipped = order.status === "shipped" || order.status === "delivered";
  const steps = [
    { label: "訂單成立", complete: true },
    { label: "人工付款確認", complete: order.paymentStatus === "manual-confirmed" },
    { label: "完成包裝", complete: packed && Boolean(order.packingPhotoId) },
    { label: "確認出貨", complete: shipped },
    { label: "確認送達", complete: order.status === "delivered" },
  ];
  return <section className={styles.progress} aria-label="訂單處理進度">
    <h3 className={styles.heading}>訂單處理進度</h3>
    <p className={styles.legend}>綠燈＝已完成　紅燈＝尚未完成（非錯誤）</p>
    <ol className={styles.steps}>{steps.map(step => <li key={step.label} className={styles.step}>
      <span className={step.complete ? styles.complete : styles.pending} aria-hidden="true" />
      <span>{step.label}</span><strong>{step.complete ? "已完成" : "未完成"}</strong>
    </li>)}</ol>
    <p className={styles.note}>本機 Demo 狀態；不代表實際收款、物流配送或通知送達。</p>
  </section>;
}
