"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { demoApi, DemoApiError, type DemoChallenge, type DemoLookup } from "../demo-api";
import { demoCheckoutSuccessStorageKey } from "./demo-checkout-success-page";
import { DemoOrderProgress } from "./demo-order-progress";
const labels = { confirmed: "訂單成立", packed: "已完成包裝，等待出貨", shipped: "已出貨", delivered: "已送達" } as const;
type StoredReceipt = { orderId?: string; orderNumber?: string; customerName?: string; phone?: string };
function getReceipt(orderParam: string): StoredReceipt {
  if (typeof window === "undefined") return {};
  try {
    const receipt = JSON.parse(sessionStorage.getItem(demoCheckoutSuccessStorageKey) ?? "{}") as StoredReceipt;
    return receipt.orderId && (!orderParam || receipt.orderId === orderParam || receipt.orderNumber === orderParam) ? receipt : {};
  } catch { return {}; }
}
const secondsLeft = (until: number, now: number) => Math.max(0, Math.ceil((until - now) / 1000));
export function OrderLookupPage() {
  const orderParam = useSearchParams().get("order") ?? "";
  const [orderId, setOrderId] = useState(orderParam);
  const [customerName, setCustomerName] = useState("");
  const [lastThree, setLastThree] = useState("");
  const [challenge, setChallenge] = useState<DemoChallenge>();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<DemoLookup>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [clock, setClock] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const requestLock = useRef(false);
  const otpInput = useRef<HTMLInputElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const stepTwo = useRef<HTMLElement>(null);
  const resultPanel = useRef<HTMLElement>(null);
  const resetVerification = () => { setChallenge(undefined); setCode(""); setResult(undefined); setError(""); };
  const restoreReceipt = () => {
    const recovered = getReceipt(orderParam);
    if (!recovered.orderId) { setRecoveryMessage("請填入訂單編號、顧客姓名與手機末三碼，可在任何裝置查單。"); return; }
    setOrderId(recovered.orderNumber ?? recovered.orderId); setCustomerName(recovered.customerName ?? "");
    setLastThree(recovered.phone?.slice(-3) ?? ""); resetVerification();
    setRecoveryMessage("已帶入這個分頁剛才的訂單資料，請取得驗證碼。");
  };
  useEffect(() => {
    const timer = window.setTimeout(() => { if (getReceipt(orderParam).orderId) restoreReceipt(); }, 0);
    return () => window.clearTimeout(timer);
    // Original-tab receipt is convenience only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderParam]);
  useEffect(() => {
    if (!challenge && !blockedUntil) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [challenge, blockedUntil]);
  useEffect(() => {
    if (!challenge || result) return;
    stepTwo.current?.scrollIntoView?.({ block: "start" });
    otpInput.current?.focus({ preventScroll: true });
  }, [challenge, result]);
  useEffect(() => {
    if (result) { resultPanel.current?.scrollIntoView?.({ block: "start" }); resultPanel.current?.focus({ preventScroll: true }); }
  }, [result]);
  useEffect(() => {
    if (error) { feedback.current?.scrollIntoView?.({ block: "center" }); feedback.current?.focus({ preventScroll: true }); }
  }, [error]);
  const fields = { orderId: orderId.trim(), customerName: customerName.trim(), phoneLastThree: lastThree };
  const valid = Boolean(fields.orderId && fields.customerName && /^\d{3}$/.test(lastThree));
  const expiresAt = Number(challenge?.expiresAt) || 0;
  const remaining = secondsLeft(expiresAt, clock);
  const retrySeconds = secondsLeft(blockedUntil, clock);
  const resendSeconds = Math.max(retrySeconds, secondsLeft(challenge?.resendAvailableAt ?? 0, clock));
  const usable = Boolean(challenge && challenge.usable !== false && remaining > 0);
  const fail = (e: unknown, fallback: string) => {
    const now = Date.now(); setClock(now);
    if (e instanceof DemoApiError && e.retryAfterSeconds) {
      setBlockedUntil(now + e.retryAfterSeconds * 1000);
      setError(`嘗試次數過多，冷卻中。請等待 ${e.retryAfterSeconds} 秒後再試。`);
    } else setError(e instanceof Error ? e.message : fallback);
  };
  const issue = async () => {
    if (requestLock.current) return;
    if (!valid) { setError("請完整填入訂單編號、顧客姓名與手機末三碼。"); return; }
    if (resendSeconds > 0) { setError(`冷卻中，請等待 ${resendSeconds} 秒後再取得驗證碼。`); return; }
    requestLock.current = true; setBusy("正在取得驗證碼，請稍候…"); setError(""); setResult(undefined);
    try {
      const received = await demoApi.issueLookupOtp(fields); const now = Date.now(); setClock(now); setCode("");
      const expiry = Number(received.expiresAt) || Date.parse(String(received.expiresAt)) || now + 300000;
      setChallenge({ ...received, expiresAt: expiry, resendAvailableAt: received.resendAvailableAt ?? now + 60000 });
    } catch (e) { fail(e, "取得驗證碼失敗，請稍後再試。"); }
    finally { requestLock.current = false; setBusy(""); }
  };
  const lookup = async () => {
    if (requestLock.current) return;
    if (!challenge || !usable) { setError("驗證碼已使用或過期，請等冷卻結束後重新取得。"); return; }
    if (!/^\d{6}$/.test(code)) { setError("請輸入 6 位數驗證碼。"); return; }
    requestLock.current = true; setBusy("正在查詢訂單，請稍候…"); setError(""); setResult(undefined);
    try { setResult(await demoApi.lookup({ ...fields, challengeId: challenge.challengeId, code })); setChallenge(c => c ? { ...c, usable: false } : c); }
    catch (e) { fail(e, "查無符合資料的訂單，或驗證碼無效／過期，請確認查單資料後再試。"); }
    finally { requestLock.current = false; setBusy(""); }
  };
  return <main className="py-8"><section className="demo-panel">
    <h1>查詢訂單</h1>
    <p>訂單編號＋顧客姓名＋手機末三碼，再完成 OTP 驗證。任何裝置都能查單。</p>
    <p className="prototype-notice">獨立沙盒測試：不會發送真實簡訊。</p>
    <Link className="filter-button mt-4 inline-flex" href="/">返回首頁</Link>
    {busy && <p role="status" aria-live="polite" className="mt-4">{busy}</p>}
    {error && <div ref={feedback} tabIndex={-1} role="alert" className="product-draft-alert mt-4"><p>{error}</p>{retrySeconds > 0 && <p>目前冷卻剩餘 {retrySeconds} 秒；結束後可再嘗試。</p>}</div>}
    {!challenge ? <form onSubmit={e => { e.preventDefault(); void issue(); }} aria-label="第一步查單資料">
      <h2 className="mt-6">第一步：取得查單驗證碼</h2>
      <p>以下三項皆必填，姓名請使用訂購時留下的姓名。</p>
      <label className="form-field mt-4">訂單編號<input className="form-input" autoComplete="off" maxLength={30} placeholder="例如 261002-001" disabled={Boolean(busy)} value={orderId} onChange={e => { setOrderId(e.target.value); resetVerification(); }} /></label>
      <label className="form-field mt-4">顧客姓名<input className="form-input" autoComplete="name" maxLength={100} disabled={Boolean(busy)} value={customerName} onChange={e => { setCustomerName(e.target.value); resetVerification(); }} /></label>
      <label className="form-field mt-4">手機末三碼<input className="form-input" inputMode="numeric" pattern="[0-9]{3}" maxLength={3} disabled={Boolean(busy)} value={lastThree} onChange={e => { setLastThree(e.target.value.replace(/\D/g, "").slice(0, 3)); resetVerification(); }} /></label>
      <button type="submit" className="primary-action mt-6" disabled={Boolean(busy) || retrySeconds > 0}>{busy ? "正在取得驗證碼…" : retrySeconds > 0 ? `冷卻中，請等待 ${retrySeconds} 秒` : "取得查單驗證碼"}</button>
      <button className="filter-button mt-4" type="button" disabled={Boolean(busy)} onClick={restoreReceipt}>重新載入本分頁訂單資料</button>
      {recoveryMessage && <p role="status" className="mt-3">{recoveryMessage}</p>}
    </form> : <section ref={stepTwo} className="mt-6 scroll-mt-4" aria-labelledby="otp-step-heading">
      <h2 id="otp-step-heading">第二步：驗證並查詢訂單</h2>
      <p role="status">已取得查單驗證碼，請在下方輸入。</p>
      <p>訂單：{fields.orderId}／姓名：{fields.customerName}／手機末三碼：{lastThree}</p>
      <p className="prototype-notice mt-4">沙盒測試 OTP（本機驗證碼）：<strong>{challenge.demoCode}</strong></p>
      <p aria-live="off">OTP 有效時間：{remaining > 0 ? `剩餘 ${Math.floor(remaining / 60)} 分 ${remaining % 60} 秒（5 分鐘內有效）` : "已過期，請重新取得"}</p>
      {!usable && !result && <p role="status">這組驗證碼已使用、失效或過期，請等重送冷卻結束後重新取得。</p>}
      <form onSubmit={e => { e.preventDefault(); void lookup(); }} aria-label="第二步 OTP 驗證">
        <label className="form-field mt-4">驗證碼<input ref={otpInput} className="form-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} disabled={Boolean(busy)} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
        <button type="submit" className="primary-action mt-6" disabled={Boolean(busy) || !usable || retrySeconds > 0}>查詢訂單</button>
      </form>
      <button type="button" className="filter-button mt-4" disabled={Boolean(busy) || resendSeconds > 0} onClick={() => void issue()}>{resendSeconds > 0 ? `重新取得驗證碼（冷卻 ${resendSeconds} 秒）` : "重新取得查單驗證碼"}</button>
      <button type="button" className="filter-button mt-4" disabled={Boolean(busy)} onClick={resetVerification}>修改查單資料</button>
    </section>}
    {result && <article ref={resultPanel} tabIndex={-1} className="demo-result scroll-mt-4"><h2>{labels[result.order.status]}</h2>
      <p>訂單編號：{result.order.orderNumber ?? result.order.orderId}</p><DemoOrderProgress order={result.order} />
      <p>付款方式：{({ "bank-transfer": "銀行轉帳", cash: "現金", "phone-confirmation": "電話確認", "line-voice-confirmation": "LINE 語音確認" } as const)[result.order.paymentMethod]}</p>
      <p>付款狀態：{result.order.paymentStatus === "manual-confirmed" ? "已人工確認" : "待人工確認"}</p>
      <p>包裝照片：{result.order.packingPhotoId ? "已由店家上傳" : "尚未上傳"}</p>
      <h3>通知紀錄</h3><ul>{result.notifications.map(note => <li key={note.id}>{note.path}：{note.state}</li>)}</ul>
      <Link className="primary-action mt-6 inline-flex" href="/">返回首頁</Link>
    </article>}
  </section></main>;
}
