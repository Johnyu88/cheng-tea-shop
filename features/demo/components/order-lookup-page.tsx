"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { demoApi, type DemoChallenge, type DemoLookup } from "../demo-api";
import { demoCheckoutSuccessStorageKey } from "./demo-checkout-success-page";
import { DemoOrderProgress } from "./demo-order-progress";
const labels = { confirmed: "訂單成立", packed: "已完成包裝，等待出貨", shipped: "已出貨", delivered: "已送達" } as const;
type StoredReceipt = { orderId?: string; orderNumber?: string; customerName?: string; phone?: string };
function getReceipt(orderParam: string): StoredReceipt {
  if (typeof window === "undefined") return {};
  try {
    const receipt = JSON.parse(window.sessionStorage.getItem(demoCheckoutSuccessStorageKey) ?? "{}") as StoredReceipt;
    if (!receipt.orderId || (orderParam && receipt.orderId !== orderParam && receipt.orderNumber !== orderParam)) return {};
    return receipt;
  } catch { return {}; }
}
export function OrderLookupPage() {
  const orderParam = useSearchParams().get("order") ?? "";
  const [orderId, setOrderId] = useState(orderParam);
  const [customerName, setCustomerName] = useState("");
  const [lastThree, setLastThree] = useState("");
  const [challenge, setChallenge] = useState<DemoChallenge>();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<DemoLookup>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const resetVerification = () => { setChallenge(undefined); setCode(""); setResult(undefined); setError(""); };
  const restoreReceipt = () => {
    const recovered = getReceipt(orderParam);
    if (!recovered.orderId) { setRecoveryMessage("請填入訂單編號、顧客姓名與手機末三碼，可在任何裝置查單。"); return; }
    setOrderId(recovered.orderNumber ?? recovered.orderId);
    setCustomerName(recovered.customerName ?? "");
    setLastThree(recovered.phone?.slice(-3) ?? "");
    resetVerification();
    setRecoveryMessage("已帶入這個分頁剛才的訂單資料，請取得驗證碼。");
  };
  useEffect(() => {
    const timer = window.setTimeout(() => { if (getReceipt(orderParam).orderId) restoreReceipt(); }, 0);
    return () => window.clearTimeout(timer);
    // Receipt fields are convenience only; OTP is always required.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderParam]);
  const fields = { orderId: orderId.trim(), customerName: customerName.trim(), phoneLastThree: lastThree };
  const valid = Boolean(fields.orderId && fields.customerName && /^\d{3}$/.test(lastThree));
  const issue = async () => {
    if (!valid) { setError("請填入訂單編號、顧客姓名與手機末三碼。"); return; }
    resetVerification(); setBusy(true);
    try { setChallenge(await demoApi.issueLookupOtp(fields)); }
    catch (e) { setError(e instanceof Error ? e.message : "暫時無法取得驗證碼，請稍後再試。"); }
    finally { setBusy(false); }
  };
  const lookup = async () => {
    if (!challenge || !valid) return;
    setBusy(true); setResult(undefined);
    try { setResult(await demoApi.lookup({ ...fields, challengeId: challenge.challengeId, code })); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "無法驗證查單資料，請確認資料或稍後再試。"); }
    finally { setBusy(false); }
  };
  return <main className="py-8"><section className="demo-panel">
    <h1>查詢訂單</h1>
    <p>輸入訂單編號、訂購時的姓名與手機末三碼，再完成驗證碼驗證。換手機或瀏覽器也能查詢。</p>
    <p className="prototype-notice">目前為獨立測試環境，驗證碼顯示於頁面，不會發送真實簡訊。</p>
    <Link className="filter-button mt-4 inline-flex" href="/">返回首頁</Link>
    {error && <div role="alert" className="product-draft-alert"><p>{error}</p><p>請確認查單資料，驗證碼過期時請重新取得；頻繁嘗試時請稍後再試。</p></div>}
    <button className="filter-button mt-4" type="button" disabled={busy} onClick={restoreReceipt}>重新載入本分頁訂單資料</button>
    {recoveryMessage && <p role="status" className="mt-3">{recoveryMessage}</p>}
    <label className="form-field mt-6">訂單編號<input className="form-input" autoComplete="off" placeholder="例如 261002-001" disabled={busy} value={orderId} onChange={e => { setOrderId(e.target.value); resetVerification(); }} /></label>
    <label className="form-field mt-4">顧客姓名<input className="form-input" autoComplete="name" disabled={busy} value={customerName} onChange={e => { setCustomerName(e.target.value); resetVerification(); }} /></label>
    <label className="form-field mt-4">手機末三碼<input className="form-input" inputMode="numeric" pattern="[0-9]{3}" maxLength={3} disabled={busy} value={lastThree} onChange={e => { setLastThree(e.target.value.replace(/\D/g, "").slice(0, 3)); resetVerification(); }} /></label>
    <button className="filter-button mt-4" disabled={busy || !valid} onClick={() => void issue()}>{challenge ? "重新取得查單驗證碼" : "取得查單驗證碼"}</button>
    {challenge && <div className="mt-4">
      <p role="status">驗證請求已受理。此測試環境請使用下方模擬驗證碼。</p>
      <p className="prototype-notice">本機驗證碼：<strong>{challenge.demoCode}</strong></p>
      <label className="form-field mt-4">驗證碼<input className="form-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} disabled={busy} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
      <button className="primary-action mt-6" disabled={busy || !/^\d{6}$/.test(code)} onClick={() => void lookup()}>查詢訂單</button>
    </div>}
    {result && <article className="demo-result"><h2>{labels[result.order.status]}</h2>
      <p>訂單編號：{result.order.orderNumber ?? result.order.orderId}</p>
      <DemoOrderProgress order={result.order} />
      <p>付款方式：{({ "bank-transfer": "銀行轉帳", cash: "現金", "phone-confirmation": "電話確認", "line-voice-confirmation": "LINE 語音確認" } as const)[result.order.paymentMethod]}</p>
      <p>付款狀態：{result.order.paymentStatus === "manual-confirmed" ? "已人工確認" : "待人工確認"}</p>
      <p>包裝照片：{result.order.packingPhotoId ? "已由店家上傳" : "尚未上傳"}</p>
      <h3>通知紀錄</h3><ul>{result.notifications.map(note => <li key={note.id}>{note.path}：{note.state}</li>)}</ul>
      <Link className="primary-action mt-6 inline-flex" href="/">返回首頁</Link>
    </article>}
  </section></main>;
}
