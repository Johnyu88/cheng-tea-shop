"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
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
  const [clearing, setClearing] = useState(false);
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);

  async function clearAfterSending() {
    if (!cart?.lines.length || clearing) return;
    if (!window.confirm("請確認你已將訂購內容傳送給陳老師。清空後購物車無法還原，確定清空？")) return;
    setClearing(true);
    try {
      const result = cartService.clearCart ? await cartService.clearCart() : await (async () => {
        for (const item of cart.lines) {
          const removed = await cartService.removeItem(item.productId, item.variantId);
          if (!removed.ok) return removed;
        }
        return cartService.getCart();
      })();
      if (!result.ok) { setFeedback("無法清空購物車，請稍後再試。"); return; }
      setCart(result.value);
      setFeedback("購物車已清空。請保留 LINE 訊息以便與店家確認；這不代表網站已自動成立訂單。");
    } catch { setFeedback("清空失敗，請稍後再試。"); }
    finally { setClearing(false); }
  }

  async function abandonPurchase() {
    if (!cart?.lines.length || clearing) return;
    setClearing(true);
    setError("");
    setFeedback("");
    try {
      const result = cartService.clearCart ? await cartService.clearCart() : await (async () => {
        for (const item of cart.lines) {
          const removed = await cartService.removeItem(item.productId, item.variantId);
          if (!removed.ok) return removed;
        }
        return cartService.getCart();
      })();
      if (!result.ok) {
        setError("無法清除購物車，尚未送出的資料仍保留，請稍後再試。");
        return;
      }
      setCart(result.value);
      setFeedback("已放棄本次購買；尚未送出的購物車資料已清除，未成立任何訂單。");
      setAbandonDialogOpen(false);
    } catch {
      setError("清除失敗，尚未送出的資料仍保留，請稍後再試。");
    } finally {
      setClearing(false);
    }
  }
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
        <div className="mt-5" aria-label="LINE 訂購三步驟">
          <h3>用 LINE 傳送訂購清單</h3>
          <p className="mt-2">步驟 1：複製以下清單。步驟 2：開啟 LINE 對話並貼上。步驟 3：按「傳送」給陳老師。</p>
          <div className="form-actions mt-3">
            <button className="filter-button" type="button" onClick={() => void copyText(summary, "已複製清單。請開啟 LINE，貼上內容並按傳送。")}>1. 複製訂購清單</button>
            <a className="button-quiet" href={merchantLine} target="_blank" rel="noopener noreferrer">2. 開啟陳老師 LINE</a>
          </div>
          <p className="mt-3" role="status">請先複製清單，再到 LINE 貼上並送出；網站不會自動傳訊。</p>
          <p className="muted mt-2">傳送紀錄以雙方實際 LINE 對話為準；請不要在老師確認前匯款。</p>
        </div>
      </section> : <p className="mt-5">尚未選擇茶品，也可以先聯絡陳老師詢問。</p>}
      {Boolean(cart?.lines.length) && <section className="mt-6" aria-label="傳送後清空購物車">
        <p>已將訂購清單貼到 LINE 並傳送給陳老師？確認傳送後可清空購物車，方便下次選茶。</p>
        <button className="filter-button mt-3" type="button" disabled={clearing} onClick={() => void clearAfterSending()}>
          {clearing ? "正在清空…" : "已傳送訂購清單，清空購物車"}
        </button>
      </section>}
      <div className="manual-order-primary-actions mt-6" aria-label="結帳操作">
        <a className="primary-action button-primary" href={merchantLine} target="_blank" rel="noopener noreferrer">傳送訂單／確認下單（LINE）</a>
        <button className="abandon-action button-danger" type="button" disabled={clearing} onClick={() => setAbandonDialogOpen(true)}>放棄本次購買</button>
      </div>
      <div className="form-actions mt-4">
        <a className="primary-action button-secondary" href={`tel:${merchantPhone}`}>電話訂購：0919-086-099</a>
        <a className="button-quiet" href={merchantLine} target="_blank" rel="noopener noreferrer">透過 LINE 聯絡訂購</a>
        <Link className="text-button button-quiet" href="/">繼續選茶</Link>
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
      {abandonDialogOpen && <AbandonDialog cancel={() => setAbandonDialogOpen(false)} confirm={() => void abandonPurchase()} />}
    </section>
  </main>;
}

function AbandonDialog({ cancel, confirm }: { cancel: () => void; confirm: () => void }): JSX.Element {
  return <div className="abandon-dialog-backdrop"><div className="abandon-dialog" role="dialog" aria-modal="true" aria-labelledby="manual-abandon-dialog-heading"><h2 id="manual-abandon-dialog-heading">要放棄本次購買嗎？</h2><p>確認後將清除尚未送出的購物車與結帳草稿；已成立的訂單不會受到影響。</p><div className="form-actions"><button className="filter-button" type="button" onClick={cancel}>繼續購買／返回填寫</button><button className="abandon-action" type="button" onClick={confirm}>確認放棄</button></div></div></div>;
}
