"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { demoApi, type DemoChallenge, type DemoLookup } from "../demo-api";

const labels = { confirmed: "訂單成立", packed: "已完成包裝，等待出貨", shipped: "已出貨", delivered: "已送達" } as const;
export function OrderLookupPage() {
  const params = useSearchParams();
  const [orderId, setOrderId] = useState(params.get("order") ?? "");
  const [accessSecret, setAccessSecret] = useState(params.get("token") ?? "");
  const [phone, setPhone] = useState("0912000000");
  const [lastThree, setLastThree] = useState("000");
  const [challenge, setChallenge] = useState<DemoChallenge>();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<DemoLookup>();
  const [error, setError] = useState("");
  const issue = async () => { try { setChallenge(await demoApi.issueOtp(phone, "lookup")); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "驗證失敗"); } };
  const lookup = async () => { try { if (!challenge) throw new Error("請先取得合成驗證碼"); setResult(await demoApi.lookup({ orderId, accessSecret, phone, phoneLastThree: lastThree, challengeId: challenge.challengeId, code })); setError(""); } catch (e) { setResult(undefined); setError(e instanceof Error ? e.message : "查單失敗"); } };
  return <main className="py-8"><p className="prototype-notice">本頁只查詢本機合成訂單；後三碼只是提示，仍必須同時通過 OTP 與高熵查單 token。</p><section className="demo-panel"><h1>查詢示範訂單</h1>{error && <div role="alert" className="product-draft-alert">{error}</div>}<label className="form-field mt-6">訂單編號<input className="form-input" value={orderId} onChange={e => setOrderId(e.target.value)} /></label><label className="form-field mt-4">查單 token<input className="form-input" type="password" value={accessSecret} onChange={e => setAccessSecret(e.target.value)} /></label><label className="form-field mt-4">合成手機<input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} /></label><label className="form-field mt-4">手機後三碼<input className="form-input" inputMode="numeric" maxLength={3} value={lastThree} onChange={e => setLastThree(e.target.value)} /></label><button className="filter-button mt-4" onClick={() => void issue()}>取得查單驗證碼</button>{challenge && <p role="status" className="prototype-notice">本機驗證碼：<strong>{challenge.demoCode}</strong></p>}<label className="form-field mt-4">驗證碼<input className="form-input" inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} /></label><button className="primary-action mt-6" onClick={() => void lookup()}>查詢訂單</button>{result && <article className="demo-result"><h2>{labels[result.order.status]}</h2><p>付款狀態：{result.order.paymentStatus === "simulated-confirmed" ? "模擬確認" : "待模擬確認"}</p><p>包裝照片：{result.order.packingPhotoId ? "已由店家上傳" : "尚未上傳"}</p><h3>通知紀錄</h3><ul>{result.notifications.map(note => <li key={note.id}>{note.path}：{note.state}</li>)}</ul><h3>手機推送預覽（未送出）</h3><p><strong>{result.mobilePushPreview.title}</strong><br />{result.mobilePushPreview.body}</p><p>狀態：preview-only；未註冊推送服務、未傳送至任何裝置。</p></article>}</section></main>;
}
