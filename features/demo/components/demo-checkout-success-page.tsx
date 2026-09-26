"use client";

import Link from "next/link";
import { useEffect, useState, type JSX } from "react";

export const demoCheckoutSuccessStorageKey = "demo.checkout.success";
type SuccessStatus = "confirmed" | "packed" | "shipped" | "delivered";
type SuccessData = { orderId: string; accessSecret?: string; status: SuccessStatus };
const statusLabels: Record<SuccessStatus, string> = { confirmed: "訂單成立，等待店家處理", packed: "已完成包裝，等待出貨", shipped: "已出貨", delivered: "已送達" };

function readStoredSuccess(): SuccessData | undefined {
  try {
    const stored = window.sessionStorage.getItem(demoCheckoutSuccessStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<SuccessData>;
      if (typeof parsed.orderId === "string" && parsed.orderId.length > 0) {
        const storedData: SuccessData = { orderId: parsed.orderId, status: parsed.status ?? "confirmed" };
        if (typeof parsed.accessSecret === "string") storedData.accessSecret = parsed.accessSecret;
        return storedData;
      }
    }
  } catch { /* The page remains useful without storage; the token is never rendered. */ }
  const orderId = new URLSearchParams(window.location.search).get("order");
  return orderId ? { orderId, status: "confirmed" } : undefined;
}

export function DemoCheckoutSuccessPage(props: SuccessData): JSX.Element {
  const [data, setData] = useState<SuccessData | undefined>(props.orderId ? props : undefined);
  useEffect(() => {
    if (data || props.orderId) return;
    const timer = window.setTimeout(() => setData(readStoredSuccess()), 0);
    return () => window.clearTimeout(timer);
  }, [data, props.orderId]);
  if (!data) return <main className="py-8"><section className="demo-panel"><h1>訂單成功頁</h1><p role="status">正在準備訂單資訊。</p><Link className="primary-action mt-6" href="/">返回首頁</Link></section></main>;
  return <main className="py-8"><section className="demo-panel" aria-labelledby="checkout-success-heading"><p className="prototype-notice">合成展示：沒有真實扣款、簡訊或資料傳送。</p><h1 id="checkout-success-heading">感謝您的購買</h1><p>已收到您的示範訂單，店家將依序處理。</p><p>訂單編號：{data.orderId}</p><p>訂單狀態：{statusLabels[data.status]}</p><div className="form-actions mt-6"><Link className="filter-button" href="/">返回首頁</Link><Link className="primary-action" href={`/orders?order=${encodeURIComponent(data.orderId)}`}>主動查看訂單</Link></div></section></main>;
}
