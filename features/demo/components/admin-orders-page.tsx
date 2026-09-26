"use client";

import { useState } from "react";
import { demoApi, type DemoAdminOrder } from "../demo-api";

const statusLabel = { confirmed: "訂單成立", packed: "已包裝／待出貨", shipped: "已出貨", delivered: "已送達" } as const;
export function AdminOrdersPage() {
  const [credential, setCredential] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState<DemoAdminOrder[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = async () => { setOrders(await demoApi.adminOrders()); };
  const login = async () => {
    try { setBusy(true); await demoApi.merchantLogin(credential); setAuthenticated(true); setCredential(""); await refresh(); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "店家身分確認失敗"); }
    finally { setBusy(false); }
  };
  const act = async (orderId: string, action: string, detail: Record<string, unknown> = {}) => {
    try { setBusy(true); await demoApi.adminAction(orderId, action, detail); await refresh(); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "操作失敗"); }
    finally { setBusy(false); }
  };
  const photo = async (orderId: string, file?: File) => {
    if (!file) return;
    try { setBusy(true); await demoApi.packingPhoto(orderId, file); await refresh(); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "包裝照片上傳失敗"); }
    finally { setBusy(false); }
  };
  return <main className="py-8"><p className="prototype-notice">本機店家 Demo：不接金流、物流、Email、推送或正式客戶資料。包裝照片只存本機私有目錄。</p><section className="demo-panel"><h1>店家訂單 Demo</h1>{error && <div role="alert" className="product-draft-alert">{error}</div>}{!authenticated ? <><label className="form-field mt-6">獨立店家 Demo 密碼<input className="form-input" type="password" value={credential} onChange={e => setCredential(e.target.value)} /></label><button className="primary-action mt-6" disabled={busy} onClick={() => void login()}>確認店家身分</button></> : <><button className="filter-button mt-6" onClick={() => void refresh()}>重新整理</button><div className="demo-order-list">{orders.length === 0 && <p>目前沒有示範訂單。</p>}{orders.map(({ order, notifications }) => <article className="demo-order-card" key={order.orderId}><h2>{statusLabel[order.status]}</h2><p>{order.orderId}</p><p>付款：{order.paymentStatus === "simulated-confirmed" ? "模擬確認" : "待模擬確認"}</p>{order.paymentStatus === "pending" && <button className="filter-button" disabled={busy} onClick={() => void act(order.orderId, "confirm-payment")}>模擬付款確認</button>}{order.status === "confirmed" && <label className="form-field mt-4">店家包裝照片<input className="form-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => void photo(order.orderId, e.target.files?.[0])} /></label>}{order.status === "packed" && <button className="primary-action mt-4" disabled={busy || order.paymentStatus !== "simulated-confirmed"} onClick={() => void act(order.orderId, "ship")}>人工確認出貨</button>}{order.status === "shipped" && <button className="primary-action mt-4" disabled={busy} onClick={() => void act(order.orderId, "deliver")}>模擬送達</button>}<h3 className="mt-6">模擬通知</h3><ul>{notifications.map(note => <li key={note.id}>{note.audience}／{note.path}／{note.state} {note.state === "queued" && <><button className="text-button" onClick={() => void act(order.orderId, "simulate-notification", { notificationId: note.id, outcome: "success" })}>模擬成功</button><button className="text-button" onClick={() => void act(order.orderId, "simulate-notification", { notificationId: note.id, outcome: "failure" })}>模擬失敗</button></>}{note.state === "failed" && <button className="text-button" onClick={() => void act(order.orderId, "retry-notification", { notificationId: note.id })}>重試排隊</button>}</li>)}</ul></article>)}</div></>}</section></main>;
}
