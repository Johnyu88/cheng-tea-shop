"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Cart, CheckoutDraft } from "@/lib/domain";
import { normalizeTaiwanMobile } from "@/lib/domain/phone";
import { useCommerce } from "@/features/commerce/components/commerce-provider";
import { demoApi, type DemoChallenge, type DemoPlacedOrder } from "../demo-api";
import { DemoCheckoutSuccessPage } from "./demo-checkout-success-page";
import { CheckoutExitNav } from "@/features/checkout/components/checkout-exit-nav";
import { demoCheckoutSuccessStorageKey } from "./demo-checkout-success-page";

type Step = "identity" | "delivery" | "review";
const trustedAddress = "台北市中正區測試路 1 號";
const initial: CheckoutDraft = { name: "", phone: "0912000000", email: "", deliveryMethod: "home-delivery", address: trustedAddress, paymentMethod: "bank-transfer" };
const paymentLabels: Record<CheckoutDraft["paymentMethod"], string> = { "bank-transfer": "銀行轉帳", cash: "現金", "phone-confirmation": "電話確認", "line-voice-confirmation": "LINE 語音確認" };

export function normalizeDemoCheckoutDraft(draft: CheckoutDraft): CheckoutDraft {
  const email = draft.email?.trim();
  if (!email) {
    const withoutEmail = { ...draft };
    delete withoutEmail.email;
    return withoutEmail;
  }
  return { ...draft, email };
}

export function DemoCheckoutPage() {
  const { cartService } = useCommerce();
  const [cart, setCart] = useState<Cart>();
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState<Step>("identity");
  const [challenge, setChallenge] = useState<DemoChallenge>();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState<DemoPlacedOrder>();
  const [previousSuccess, setPreviousSuccess] = useState<DemoPlacedOrder>();
  useEffect(() => { void cartService.getCart().then(value => { if (value.ok) { setCart(value.value); if (!value.value.lines.length) { try { const stored = window.sessionStorage.getItem(demoCheckoutSuccessStorageKey); if (stored) { const parsed = JSON.parse(stored) as DemoPlacedOrder; if (typeof parsed.orderId === "string" && /^DEMO-[0-9a-f-]{36}$/.test(parsed.orderId)) setPreviousSuccess(parsed); } } catch { /* no receipt: show ordinary empty cart */ } } } else setError(value.error.message); }); }, [cartService]);
  const change = <K extends keyof CheckoutDraft>(key: K, value: CheckoutDraft[K]) => { setDraft(old => ({ ...old, [key]: value })); setError(""); };
  const issue = async () => {
    try { setBusy(true); setChallenge(await demoApi.issueOtp(draft.phone, "checkout")); setError(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "無法建立驗證碼"); }
    finally { setBusy(false); }
  };
  const identityNext = () => {
    const phone = normalizeTaiwanMobile(draft.phone);
    if (!phone || !draft.name.trim() || !challenge || code.length !== 6) return setError("請完成姓名、合成手機與驗證碼確認。");
    if (code !== challenge.demoCode) return setError("驗證碼不正確，請重新輸入本機 Demo 顯示的驗證碼。");
    change("phone", phone); setStep("delivery");
  };
  const deliveryNext = () => {
    if (draft.deliveryMethod === "home-delivery" && draft.address?.trim() !== trustedAddress) return setError(`此地址無法自動驗證，狀態為「需要人工介入」。本機 Demo 請使用：${trustedAddress}`);
    setError(""); setStep("review");
  };
  const submit = async () => {
    if (!cart || !challenge) return;
    try {
      setBusy(true); setError("");
      const result = await demoApi.placeOrder({
        phone: draft.phone,
        challengeId: challenge.challengeId,
        code,
        draft: normalizeDemoCheckoutDraft(draft),
        lines: cart.lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
      });
      setCompleted(result);
      try { window.sessionStorage.setItem(demoCheckoutSuccessStorageKey, JSON.stringify({ ...result, customerName: draft.name.trim(), phone: draft.phone })); } catch { /* receipt remains visible even when storage is blocked */ }
      try { window.location.assign(`/checkout/success?order=${encodeURIComponent(result.orderNumber ?? result.orderId)}`); } catch { /* keep the confirmed receipt on screen if navigation is unavailable */ }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "示範訂單建立失敗"); }
    finally { setBusy(false); }
  };
  if (completed) return <DemoCheckoutSuccessPage orderId={completed.orderId} {...(completed.orderNumber ? { orderNumber: completed.orderNumber } : {})} accessSecret={completed.accessSecret} status="confirmed" />;
  if (!cart) return <main><p role="status">正在準備本機示範結帳</p>{error && <p role="alert">{error}</p>}</main>;
  if (!cart.lines.length && previousSuccess) return <DemoCheckoutSuccessPage orderId={previousSuccess.orderId} {...(previousSuccess.orderNumber ? { orderNumber: previousSuccess.orderNumber } : {})} accessSecret={previousSuccess.accessSecret} status="confirmed" />;
  if (!cart.lines.length) return <main><h1>購物車是空的</h1><p>尚未建立本次訂單。</p><Link href="/#catalog">返回首頁／繼續選茶</Link></main>;
  return <><CheckoutExitNav /><main className="py-8"><p className="prototype-notice"><strong>本機 Demo：</strong>只接受合成手機與資料；付款、Email、推送皆為模擬，不會呼叫外部服務。</p>{error && <div role="alert" className="product-draft-alert">{error}</div>}<section className="demo-panel" aria-label="本機結帳 Demo">
    {step === "identity" && <><p className="eyebrow">步驟 1／3</p><h1>身分確認</h1><label className="form-field mt-6">姓名<input className="form-input" value={draft.name} onChange={e => change("name", e.target.value)} /></label><label className="form-field mt-4">合成手機<input className="form-input" inputMode="tel" value={draft.phone} onChange={e => change("phone", e.target.value)} /></label><label className="form-field mt-4">Email（選填，僅模擬通知）<input className="form-input" value={draft.email ?? ""} onChange={e => change("email", e.target.value)} /></label><button className="filter-button mt-4" disabled={busy} onClick={() => void issue()}>取得合成驗證碼</button>{challenge && <p role="status" className="prototype-notice">本機驗證碼：<strong>{challenge.demoCode}</strong></p>}<label className="form-field mt-4">驗證碼<input className="form-input" inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} /></label><button className="primary-action mt-6" onClick={identityNext}>下一步</button></>}
    {step === "delivery" && <><p className="eyebrow">步驟 2／3</p><h1>配送與付款</h1><fieldset className="form-fieldset mt-6"><legend>配送方式</legend><label className="form-option"><input type="radio" name="demo-delivery" checked={draft.deliveryMethod === "home-delivery"} onChange={() => change("deliveryMethod", "home-delivery")} />宅配</label><label className="form-option"><input type="radio" name="demo-delivery" checked={draft.deliveryMethod === "store-pickup"} onChange={() => change("deliveryMethod", "store-pickup")} />到店取貨</label></fieldset>{draft.deliveryMethod === "home-delivery" && <label className="form-field mt-4">宅配地址<textarea className="form-textarea" value={draft.address ?? ""} onChange={e => change("address", e.target.value)} /></label>}<p className="prototype-notice">無法自動驗證的地址不會硬判成功，必須人工介入。</p><section className="form-fieldset mt-6" aria-label="展示用付款與聯絡資訊">
  <h2 className="text-xl font-bold">付款與聯絡資訊（展示資料）</h2>
  <p className="prototype-notice">以下銀行、電話與 LINE 資料採用陳老師提供的聯絡資料；目前仍是私有展示站，請勿以測試訂單實際匯款。</p>
  <p className="mt-4">銀行：中國信託</p>
  <p>匯款帳號：026540263310</p>
  <p className="mt-4">店家電話：<a href="tel:0919086099">0919-086-099（點擊撥號）</a></p>
  <p className="mt-4">LINE：<a href="https://line.me/ti/p/TT6TRQyMF6" target="_blank" rel="noopener noreferrer">開啟陳老師提供的 LINE 邀請連結</a></p>
  <p className="muted">正式 LINE QR 原圖不直接使用含背景的照片；手機可先點擊連結測試。</p>
  <p className="prototype-notice mt-4">完成匯款後，請透過電話或 LINE 告知「匯款帳號後五碼＋匯款金額」。店家人工核對入帳後安排包裝與出貨；現金或電話訂購也可直接聯絡店家確認。</p>
</section><div className="form-actions mt-6"><button className="filter-button" onClick={() => setStep("identity")}>上一步</button><button className="primary-action" onClick={deliveryNext}>下一步</button></div></>}
    {step === "review" && <><p className="eyebrow">步驟 3／3</p><h1>確認示範訂單</h1><p>共 {cart.lines.length} 項，NT${cart.subtotal.amount.toLocaleString("zh-TW")}</p><p>付款方式：傳統人工確認（匯款／現金／電話／LINE）</p><p>付款狀態：待人工確認（不會扣款）</p><div className="form-actions mt-6"><button className="filter-button" onClick={() => setStep("delivery")}>上一步</button><button className="primary-action" disabled={busy} onClick={() => void submit()}>{busy ? "建立中" : "建立示範訂單"}</button></div></>}
  </section></main></>;
}
