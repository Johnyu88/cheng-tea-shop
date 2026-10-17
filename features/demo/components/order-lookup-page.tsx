"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { demoApi, type DemoChallenge, type DemoLookup } from "../demo-api";
import { demoCheckoutSuccessStorageKey } from "./demo-checkout-success-page";
import { DemoOrderProgress } from "./demo-order-progress";

const labels = { confirmed: "訂單成立", packed: "已完成包裝，等待出貨", shipped: "已出貨", delivered: "已送達" } as const;
type StoredReceipt = { orderId?: string; accessSecret?: string; customerName?: string; phone?: string };
function getReceipt(orderParam: string): StoredReceipt {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.sessionStorage.getItem(demoCheckoutSuccessStorageKey);
    if (!stored) return {};
    const receipt = JSON.parse(stored) as StoredReceipt;
    if (!receipt.orderId || (orderParam && receipt.orderId !== orderParam)) return {};
    return receipt;
  } catch { return {}; }
}

export function OrderLookupPage() {
  const params = useSearchParams();
  const orderParam = params.get("order") ?? "";
  const [receipt, setReceipt] = useState<StoredReceipt>({});
  const [orderId, setOrderId] = useState(orderParam);
  const [accessSecret, setAccessSecret] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("0912000000");
  const [lastThree, setLastThree] = useState("000");
  const [challenge, setChallenge] = useState<DemoChallenge>();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<DemoLookup>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [advanced, setAdvanced] = useState(!orderId || !accessSecret);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const restoreReceipt = () => {
    const recovered = getReceipt(orderParam);
    if (!recovered.orderId || !recovered.accessSecret) {
      setRecoveryMessage("本分頁沒有可恢復的完整查單憑證。請展開「其他裝置查單／進階資訊」填入自行保存的資料；若已遺失查詢密語，請聯絡店家協助。");
      setAdvanced(true);
      return;
    }
    setReceipt(recovered);
    setOrderId(recovered.orderId);
    setAccessSecret(recovered.accessSecret);
    setCustomerName(recovered.customerName ?? "");
    const recoveredPhone = recovered.phone ?? "0912000000";
    setPhone(recoveredPhone);
    setLastThree(recoveredPhone.slice(-3));
    setChallenge(undefined);
    setCode("");
    setResult(undefined);
    setError("");
    setAdvanced(false);
    setRecoveryMessage("已重新帶入本分頁訂單資料，請重新取得一次性驗證碼。");
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const recovered = getReceipt(orderParam);
      if (recovered.orderId && recovered.accessSecret && !accessSecret) restoreReceipt();
    }, 0);
    return () => window.clearTimeout(timer);
    // Restore after hydration; never fetch a credential from the server or URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderParam]);

  const issue = async () => {
    try {
      if (!orderId.trim() || !accessSecret.trim()) throw new Error("這個瀏覽器分頁沒有完整查單憑證。請回到原下單分頁，或在「進階資訊」填入當時自行保存的訂單編號與憑證；未取得前不會消耗驗證碼次數。");
      if (!customerName.trim() || !/^\d{3}$/.test(lastThree) || !phone.endsWith(lastThree)) throw new Error("請填寫顧客姓名及正確手機後三碼。");
      setBusy(true);
      setChallenge(await demoApi.issueOtp(phone, "lookup")); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "驗證失敗"); }
    finally { setBusy(false); }
  };
  const lookup = async () => {
    try {
      if (!challenge || !orderId || !accessSecret) throw new Error("請先取得驗證碼，並確認訂單查詢憑證存在。");
      if (!customerName.trim() || !/^\d{3}$/.test(lastThree)) throw new Error("請填寫顧客姓名及手機後三碼。");
      setBusy(true);
      setResult(await demoApi.lookup({ orderId, accessSecret, customerName: customerName.trim(), phone, phoneLastThree: lastThree, challengeId: challenge.challengeId, code }));
      setError("");
    } catch (e) { setResult(undefined); setError(e instanceof Error ? e.message : "查單失敗"); }
    finally { setBusy(false); }
  };
  return <main className="py-8">
    <p className="prototype-notice">本機合成訂單測試：姓名和手機後三碼方便顧客確認資料；仍須使用訂單憑證與驗證碼，不能只憑姓名及三碼查看訂單。本機驗證碼不會發送真實簡訊。</p>
    <section className="demo-panel">
      <h1>查詢訂單</h1>
      <Link className="filter-button mt-4 inline-flex" href="/">返回首頁</Link>
      {error && <div role="alert" className="product-draft-alert"><p>{error}</p>{challenge && <button className="filter-button mt-3" type="button" disabled={busy} onClick={() => void issue()}>重新取得驗證碼</button>}<p className="mt-3">若仍無法查詢，請確認訂單編號、查詢密語、訂購人姓名與手機末三碼；查詢密語遺失時請聯絡店家協助。</p></div>}
      <button className="filter-button mt-4" type="button" onClick={restoreReceipt}>重新載入本分頁訂單資料</button>
      {recoveryMessage && <p role="status" className="prototype-notice mt-3">{recoveryMessage}</p>}
      {receipt.orderId && receipt.accessSecret && <p role="status">已帶入這個分頁剛才的訂單資料，不必複製查單憑證。</p>}
      {(!orderId || !accessSecret) && <p role="status" className="prototype-notice">目前尚無完整查單憑證。請使用原下單分頁，或展開「其他裝置查單／進階資訊」填入自己保存的資料。先補齊憑證，再取得 OTP；姓名與手機末三碼無法取代憑證。</p>}
      <label className="form-field mt-6">顧客姓名<input className="form-input" autoComplete="name" value={customerName} onChange={e => setCustomerName(e.target.value)} /></label>
      <label className="form-field mt-4">手機末三碼<input className="form-input" inputMode="numeric" maxLength={3} value={lastThree} onChange={e => setLastThree(e.target.value.replace(/\D/g, "").slice(0, 3))} /></label>
      <details className="mt-6" open={advanced} onToggle={e => setAdvanced(e.currentTarget.open)}>
        <summary>其他裝置查單／進階資訊</summary>
        <p>跨裝置查詢時需另外提供訂單編號、原查單憑證及完整手機號碼以驗證身分。</p>
        <label className="form-field mt-4">訂單編號<input className="form-input" value={orderId} onChange={e => setOrderId(e.target.value)} /></label>
        <label className="form-field mt-4">查單憑證<input className="form-input" type="password" autoComplete="off" value={accessSecret} onChange={e => setAccessSecret(e.target.value)} /></label>
        <label className="form-field mt-4">驗證用手機<input className="form-input" inputMode="tel" autoComplete="off" value={phone} onChange={e => setPhone(e.target.value)} /></label>
      </details>
      <button className="filter-button mt-4" disabled={busy || !orderId.trim() || !accessSecret.trim()} onClick={() => void issue()}>取得查單驗證碼</button>
      {challenge && <p role="status" className="prototype-notice">本機驗證碼：<strong>{challenge.demoCode}</strong></p>}
      <label className="form-field mt-4">驗證碼<input className="form-input" inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} /></label>
      <button className="primary-action mt-6" disabled={busy} onClick={() => void lookup()}>查詢訂單</button>
      <Link className="filter-button mt-4 inline-flex" href="/orders">查詢其他訂單</Link>
      {result && <article className="demo-result"><h2>{labels[result.order.status]}</h2>
        <DemoOrderProgress order={result.order} />
        <p>付款方式：{({ "bank-transfer": "銀行轉帳", cash: "現金", "phone-confirmation": "電話確認", "line-voice-confirmation": "LINE 語音確認" } as const)[result.order.paymentMethod]}</p>
        <p>付款狀態：{result.order.paymentStatus === "manual-confirmed" ? "已人工確認" : "待人工確認"}</p>
        <p>包裝照片：{result.order.packingPhotoId ? "已由店家上傳" : "尚未上傳"}</p>
        <h3>通知紀錄</h3><ul>{result.notifications.map(note => <li key={note.id}>{note.path}：{note.state}</li>)}</ul>
        <h3>手機推送預覽（未送出）</h3><p><strong>{result.mobilePushPreview.title}</strong><br />{result.mobilePushPreview.body}</p>
        <p>狀態：preview-only；未註冊推送服務、未傳送至任何裝置。</p>
        <Link className="primary-action mt-6 inline-flex" href="/">返回首頁</Link></article>}
    </section>
  </main>;
}
