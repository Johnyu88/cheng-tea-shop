"use client";

import { useCallback, useEffect, useState, type JSX } from "react";
import Link from "next/link";
import type { Cart, CheckoutDraft, CheckoutReceipt, DomainError } from "@/lib/domain";
import { useCommerce } from "@/features/commerce/components/commerce-provider";

type Step = "contact" | "delivery" | "review";
type Submission = "idle" | "processing" | "failure" | "success";
type CartState = { status: "loading" } | { status: "ready"; cart: Cart } | { status: "failure"; message: string };

const initialDraft: CheckoutDraft = { name: "", phone: "", deliveryMethod: "home-delivery", address: "", paymentMethod: "credit-card" };
const formatMoney = (amount: number) => `NT$${amount.toLocaleString("zh-TW")}`;
const SHOP_LINE_CONTACT_URL = "https://line.me/R/ti/p/@longying-tea-shop";

export function CheckoutPage(): JSX.Element {
  const { cartService, checkoutService } = useCommerce();
  const [cartState, setCartState] = useState<CartState>({ status: "loading" });
  const [step, setStep] = useState<Step>("contact");
  const [submission, setSubmission] = useState<Submission>("idle");
  const [draft, setDraft] = useState<CheckoutDraft>(initialDraft);
  const [error, setError] = useState<DomainError>();
  const [receipt, setReceipt] = useState<CheckoutReceipt>();
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    void cartService.getCart().then((result) => {
      if (!active) return;
      if (result.ok) setCartState({ status: "ready", cart: result.value });
      else setCartState({ status: "failure", message: result.error.message });
    });
    return () => { active = false; };
  }, [cartService]);

  useEffect(() => {
    document.getElementById(`checkout-${step}-heading`)?.focus();
  }, [step]);

  const change = <Key extends keyof CheckoutDraft>(key: Key, value: CheckoutDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(undefined);
  };
  const localError = (message: string) => { setSubmission("failure"); setError({ code: "invalid-draft", message, retryable: false }); };
  const nextContact = () => {
    if (!draft.phone.trim()) return localError("請填寫手機號碼。");
    if (!draft.name.trim()) return localError("請填寫姓名。");
    setError(undefined); setSubmission("idle"); setStep("delivery");
  };
  const nextDelivery = () => {
    if (draft.deliveryMethod === "home-delivery" && !draft.address?.trim()) return localError("宅配請填寫地址。");
    setError(undefined); setSubmission("idle"); setStep("review");
  };
  const submit = useCallback(async () => {
    if (cartState.status !== "ready" || submission === "processing") return;
    setSubmission("processing"); setError(undefined);
    const submissionDraft: CheckoutDraft = { ...draft };
    const email = draft.email?.trim();
    if (email) submissionDraft.email = email;
    else delete submissionDraft.email;
    const validation = await checkoutService.validate(submissionDraft, cartState.cart);
    if (!validation.ok) { setError(validation.error); setSubmission("failure"); return; }
    const result = await checkoutService.submit(validation.value, cartState.cart);
    if (!result.ok) { setError(result.error); setSubmission("failure"); return; }
    setReceipt(result.value); setSubmission("success");
  }, [cartState, checkoutService, draft, submission]);

  if (cartState.status === "loading") return <main><p role="status" aria-live="polite">正在準備結帳資料</p></main>;
  if (cartState.status === "failure") return <main><div role="alert">{cartState.message}</div></main>;
  if (cartState.cart.lines.length === 0) return <main><section aria-labelledby="empty-checkout-heading"><h1 id="empty-checkout-heading">購物車是空的</h1><p>請先回到購物車確認想購買的茶品。</p><Link href="/cart">查看購物車</Link><Link href="/#catalog">開始選茶</Link></section></main>;

  const message = submission === "processing" ? "正在處理訂單" : submission === "success" ? "訂單已成立" : "";
  return <main className="py-8 md:py-12"><p role="status" aria-live="polite" className="sr-only">{message}</p>{error && submission === "failure" && <div role="alert" className="mb-6 rounded-lg border-l-4 border-[var(--tea-brown)] bg-white p-4"><strong>請確認以下資料：</strong><p>{error.message}</p>{error.retryable && step === "review" && <button className="text-button" type="button" onClick={() => void submit()}>再試一次</button>}</div>}{submission === "success" && receipt ? <Success receipt={receipt} /> : <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"><section className="rounded-2xl border border-black/10 bg-white p-5 md:p-8" aria-label="結帳步驟">{step === "contact" && <Contact draft={draft} change={change} next={nextContact} />}{step === "delivery" && <Delivery draft={draft} change={change} back={() => { setError(undefined); setSubmission("idle"); setStep("contact"); }} next={nextDelivery} />}{step === "review" && <Review draft={draft} processing={submission === "processing"} back={() => { setError(undefined); setSubmission("idle"); setStep("delivery"); }} submit={() => void submit()} />}</section><Summary cart={cartState.cart} expanded={summaryExpanded} toggle={() => setSummaryExpanded((current) => !current)} /></div>}</main>;
}

type Change = <Key extends keyof CheckoutDraft>(key: Key, value: CheckoutDraft[Key]) => void;

function Contact({ draft, change, next }: { draft: CheckoutDraft; change: Change; next: () => void }): JSX.Element {
  return <><p className="eyebrow">步驟 1／3</p><h1 id="checkout-contact-heading" tabIndex={-1}>聯絡資料</h1><p>方便我們確認訂單與配送事宜。</p><div className="mt-6 grid gap-4"><label className="form-field">姓名<input className="form-input" required value={draft.name} onChange={(event) => change("name", event.target.value)} autoComplete="name" /></label><label className="form-field">手機號碼<input className="form-input" required value={draft.phone} onChange={(event) => change("phone", event.target.value)} inputMode="tel" autoComplete="tel" /></label><label className="form-field">Email（選填）<input className="form-input" value={draft.email ?? ""} onChange={(event) => change("email", event.target.value)} inputMode="email" autoComplete="email" /></label></div><div className="form-actions mt-8"><button className="primary-action" type="button" onClick={next}>下一步</button></div></>;
}

function Delivery({ draft, change, back, next }: { draft: CheckoutDraft; change: Change; back: () => void; next: () => void }): JSX.Element {
  const options = draft.deliveryMethod === "home-delivery" ? [["credit-card", "信用卡"], ["line-pay", "LINE Pay"]] : [["credit-card", "信用卡"], ["line-pay", "LINE Pay"], ["pay-at-store", "到店付款"]];
  const delivery = (method: CheckoutDraft["deliveryMethod"]) => { change("deliveryMethod", method); if (method === "home-delivery" && draft.paymentMethod === "pay-at-store") change("paymentMethod", "credit-card"); };
  return <><p className="eyebrow">步驟 2／3</p><h1 id="checkout-delivery-heading" tabIndex={-1}>配送方式</h1><fieldset className="form-fieldset mt-6"><legend>選擇配送方式</legend><label className="form-option"><input type="radio" name="delivery" checked={draft.deliveryMethod === "home-delivery"} onChange={() => delivery("home-delivery")} />宅配</label><label className="form-option"><input type="radio" name="delivery" checked={draft.deliveryMethod === "store-pickup"} onChange={() => delivery("store-pickup")} />到店取貨</label></fieldset>{draft.deliveryMethod === "home-delivery" && <label className="form-field mt-4">宅配地址<textarea className="form-textarea" required value={draft.address ?? ""} onChange={(event) => change("address", event.target.value)} autoComplete="street-address" /></label>}<fieldset className="form-fieldset mt-6"><legend>付款方式</legend>{options.map(([value, label]) => <label className="form-option" key={value}><input type="radio" name="payment" checked={draft.paymentMethod === value} onChange={() => change("paymentMethod", value as CheckoutDraft["paymentMethod"])} />{label}</label>)}</fieldset><div className="form-actions mt-8"><button className="filter-button" type="button" onClick={back}>上一步</button><button className="primary-action" type="button" onClick={next}>下一步</button></div></>;
}

function Review({ draft, processing, back, submit }: { draft: CheckoutDraft; processing: boolean; back: () => void; submit: () => void }): JSX.Element {
  const payment = draft.paymentMethod === "credit-card" ? "信用卡" : draft.paymentMethod === "line-pay" ? "LINE Pay" : "到店付款";
  return <><p className="eyebrow">步驟 3／3</p><h1 id="checkout-review-heading" tabIndex={-1}>確認訂單</h1><dl className="mt-6 grid gap-3"><div><dt>配送</dt><dd>{draft.deliveryMethod === "home-delivery" ? `宅配至 ${draft.address}` : "到店取貨"}</dd></div><div><dt>付款</dt><dd>{payment}</dd></div></dl><p className="mt-6 rounded-lg bg-[var(--mist)] p-4">部分茶品數量有限；若庫存不足，我們會優先以電話與您聯絡後續安排。</p><div className="form-actions mt-8"><button className="filter-button" type="button" disabled={processing} onClick={back}>返回配送方式</button><button className="primary-action" type="button" disabled={processing} onClick={submit}>{processing ? "處理中" : "送出訂單"}</button></div></>;
}

function Summary({ cart, expanded, toggle }: { cart: Cart; expanded: boolean; toggle: () => void }): JSX.Element {
  const lines = expanded || cart.lines.length < 4 ? cart.lines : cart.lines.slice(0, 3);
  return <aside className="rounded-2xl bg-[var(--mist)] p-5" aria-label="訂單摘要"><h2>訂單摘要</h2><ul id="checkout-summary-lines" className="mt-4 grid gap-3">{lines.map((line) => <li key={`${line.productId}-${line.variantId}`}><strong>{line.productName}</strong><br />{line.specification} × {line.quantity}<br />{formatMoney(line.unitPrice.amount * line.quantity)}</li>)}</ul>{cart.lines.length >= 4 && <button className="text-button mt-4" type="button" aria-expanded={expanded} aria-controls="checkout-summary-lines" onClick={toggle}>{expanded ? "收合茶品" : `顯示全部 ${cart.lines.length} 項茶品`}</button>}<p className="mt-6 font-bold">小計：{formatMoney(cart.subtotal.amount)}</p></aside>;
}

function Success({ receipt }: { receipt: CheckoutReceipt }): JSX.Element {
  return <section className="rounded-2xl border border-black/10 bg-white p-6" aria-labelledby="checkout-success-heading"><h1 id="checkout-success-heading">訂單已成立</h1><p>訂單編號：{receipt.orderReference}</p><p>訂單小計：{formatMoney(receipt.total.amount)}</p><p>若有任何問題，請優先電話聯絡，我們也會透過 LINE 協助您。</p><div className="form-actions mt-6"><a className="primary-action" href="tel:0800000000">電話聯絡我們</a><a className="text-button" href={SHOP_LINE_CONTACT_URL}>LINE 聯絡我們</a></div><Link className="mt-6 inline-block" href="/#catalog">繼續選茶</Link></section>;
}
