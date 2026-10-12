"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Cart } from "@/lib/domain";
import { useCommerce } from "@/features/commerce/components/commerce-provider";

const merchantPhone = "0919086099";
const merchantLine = "https://line.me/ti/p/TT6TRQyMF6";
const bankAccount = "026540263310";

export function MerchantManualCheckoutPage() {
  const { cartService } = useCommerce();
  const [cart, setCart] = useState<Cart>();
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    let active = true;
    void cartService.getCart().then(result => {
      if (!active) return;
      if (result.ok) setCart(result.value);
      else setError("目前無法取得購物車，請直接電話或 LINE 聯絡店家。");
    }).catch(() => { if (active) setError("目前無法取得購物車，請直接聯絡店家。"); });
    return () => { active = false; };
  }, [cartService]);

  const summary = useMemo(() => {
    if (!cart?.lines.length) return "";
    return [
      "您好，我想向陳老師茶行確認以下茶品：",
      ...cart.lines.map((line, index) => `${index + 1}. ${line.productName}／${line.specification} × ${line.quantity}`),
      `網站參考小計：NT$${cart.subtotal.amount.toLocaleString("zh-TW")}`,
      "請協助確認庫存、最後金額、運費及付款方式。謝謝。",
    ].join("\n");
  }, [cart]);

  async function copyText(text: string, success: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(success);
    } catch {
      setFeedback("無法自動複製；請長按文字選取後複製。");
    }
  }

  return <main className="py-8 md:py-12">
    <section className="demo-panel" aria-labelledby="manual-order-heading">
      <p className="eyebrow">陳老師茶行</p>
      <h1 id="manual-order-heading">電話或 LINE 訂購茶品</h1>
      <p className="mt-3">目前提供人工接單服務。請先向陳老師確認商品、庫存、運費與訂單金額，再依店家確認的方式付款。</p>
      {error && <p role="alert" className="mt-3">{error}</p>}
      {cart?.lines.length ? <section className="mt-6" aria-label="本次選購茶品">
        <h2>本次選購清單</h2>
        <ul className="mt-3">
          {cart.lines.map(line => <li key={line.variantId} className="mt-2">
            {line.productName}／{line.specification} × {line.quantity}
          </li>)}
        </ul>
        <p className="mt-3">參考小計：NT${cart.subtotal.amount.toLocaleString("zh-TW")}（實際金額以店家確認為準）</p>
        <label className="form-field mt-4">訂購內容（可複製後貼到 LINE）
          <textarea className="form-textarea" readOnly rows={7} value={summary} />
        </label>
        <button className="filter-button mt-3" type="button" onClick={() => void copyText(summary, "已複製訂購內容，請貼到 LINE 傳送給陳老師。")}>複製訂購清單</button>
      </section> : <p className="mt-5">尚未選擇茶品，也可以先聯絡陳老師詢問。</p>}
      <div className="form-actions mt-6">
        <a className="primary-action" href={`tel:${merchantPhone}`}>電話訂購：0919-086-099</a>
        <a className="filter-button" href={merchantLine} target="_blank" rel="noopener noreferrer">透過 LINE 聯絡訂購</a>
        <Link className="text-button" href="/">繼續選茶</Link>
      </div>
      {feedback && <p role="status" className="mt-3">{feedback}</p>}
      <div className="mt-6">
        <a href={merchantLine} target="_blank" rel="noopener noreferrer" aria-label="開啟陳老師 LINE 聯絡方式">
          <img src="/media/chen-teacher-line-qr.svg" alt="陳老師 LINE QR Code" width={180} height={180} />
        </a>
        <p className="muted">可掃描 QR Code，或直接點擊上方 LINE 聯絡連結。</p>
      </div>
      <section className="mt-6" aria-label="匯款資訊">
        <h2>匯款資訊</h2>
        <p className="mt-3">銀行：中國信託</p>
        <p>帳號：{bankAccount}</p>
        <button className="filter-button mt-3" type="button" onClick={() => void copyText(bankAccount, "已複製匯款帳號。")}>複製匯款帳號</button>
        <p className="mt-3">請在陳老師確認訂單與金額後再匯款。匯款後以電話或 LINE 告知轉帳帳號後五碼與金額，以利人工確認。</p>
      </section>
      <p className="mt-6">本頁不會自動送出訂單或扣款。向店家實際完成聯絡、由店家確認接單後，訂購才成立。</p>
    </section>
  </main>;
}
