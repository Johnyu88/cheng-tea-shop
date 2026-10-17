"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PUBLIC_CART_KEY, type PublicCartLine } from "@/features/home/components/add-tea-to-cart";
const lineUrl = "https://line.me/ti/p/TT6TRQyMF6";
const format = (n: number) => "NT$" + n.toLocaleString("zh-TW");
export function PublicOrderCheckout() {
  const [lines, setLines] = useState<PublicCartLine[]>([]);
  const [feedback, setFeedback] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [delivery, setDelivery] = useState("宅配");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(PUBLIC_CART_KEY) ?? "[]");
        if (Array.isArray(saved)) setLines(saved.filter((x): x is PublicCartLine => x && typeof x.id === "string" && typeof x.name === "string" && Number.isInteger(x.quantity) && x.quantity > 0 && x.quantity <= 30 && Number.isSafeInteger(x.price) && x.price >= 0));
      } catch { setFeedback("購物車資料無法讀取，請重新選購。"); }
    });
  }, []);
  const total = useMemo(() => lines.reduce((n, x) => n + x.price * x.quantity, 0), [lines]);
  const orderText = useMemo(() => [
    "陳老師茶行｜購買需求",
    ...lines.map((x,i) => `${i+1}. ${x.name}／${x.specification} × ${x.quantity}｜參考價 ${format(x.price*x.quantity)}`),
    `茶品參考總計：${format(total)}（不含運費；價格及庫存由店家確認）`,
    `訂購人：${customerName.trim() || "請填姓名"}`,
    `電話：${customerPhone.trim() || "請填手機"}`,
    `交貨：${delivery}`,
    ...(delivery === "宅配" ? [`收件地址：${address.trim() || "請填地址"}`] : []),
    ...(message.trim() ? [`備註：${message.trim()}`] : []),
    "請確認庫存、運費、總額與匯款方式，確認後再付款。"
  ].join("\n"), [lines,total,customerName,customerPhone,delivery,address,message]);
  function update(id: string, quantity: number) {
    const next = lines.map(x => x.id === id ? { ...x, quantity } : x).filter(x => x.quantity > 0);
    setLines(next);
    try { localStorage.setItem(PUBLIC_CART_KEY, JSON.stringify(next)); } catch { setFeedback("購物車儲存失敗。"); }
  }
  async function copyOrder() {
    if (!lines.length) { setFeedback("請先加入茶品。"); return; }
    if (!customerName.trim() || !/^09\d{8}$/.test(customerPhone.replace(/[-\s]/g,"")) || (delivery === "宅配" && !address.trim())) { setFeedback("請填寫姓名、10 碼手機，及宅配收件地址。"); return; }
    try { await navigator.clipboard.writeText(orderText); setFeedback("訂購內容已複製。請點下方 LINE，貼上並傳送給陳老師；傳送後才算提出訂購需求。"); }
    catch { setFeedback("無法自動複製，請長按下方訂購內容後手動複製。"); }
  }
  return <main className="py-8"><section className="demo-panel">
    <h1>選購清單與結帳</h1>
    <p>可在此整理欲購茶品，並透過 LINE 或電話完成人工訂購。此頁不會自動送單、扣款或保留庫存。</p>
    {!lines.length ? <p className="mt-4">購物車目前沒有茶品。<Link href="/#tea-list">返回選茶</Link></p> : <>
      <h2 className="mt-6">選購茶品</h2>
      {lines.map(x => <section className="mt-4" key={x.id}><strong>{x.name}</strong><p>{x.specification}／{format(x.price)} × {x.quantity}</p>
      <div className="form-actions">
        <button className="filter-button" type="button" onClick={() => update(x.id, x.quantity-1)}>－</button>
        <button className="filter-button" type="button" onClick={() => update(x.id, Math.min(30, x.quantity+1))}>＋</button>
        <button className="text-button" type="button" onClick={() => update(x.id, 0)}>移除</button>
      </div></section>)}
      <p className="mt-6"><strong>茶品參考小計：{format(total)}</strong>（不含運費）</p>
      <h2 className="mt-6">訂購資料</h2>
      <label className="form-field">姓名<input className="form-input" autoComplete="name" value={customerName} onChange={e=>setCustomerName(e.target.value)} maxLength={40}/></label>
      <label className="form-field">手機<input className="form-input" inputMode="tel" autoComplete="tel" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} maxLength={20}/></label>
      <label className="form-field">交貨方式<select className="form-input" value={delivery} onChange={e=>setDelivery(e.target.value)}><option>宅配</option><option>與店家約定面交</option></select></label>
      {delivery === "宅配" && <label className="form-field">收件地址<textarea className="form-input" value={address} onChange={e=>setAddress(e.target.value)} rows={2} maxLength={200}/></label>}
      <label className="form-field">其他備註<textarea className="form-input" value={message} onChange={e=>setMessage(e.target.value)} rows={2} maxLength={300}/></label>
      <label className="form-field">訂購內容（需傳送至 LINE 才成立訂購需求）<textarea className="form-input" readOnly rows={9} value={orderText}/></label>
      <button className="primary-action mt-4" type="button" onClick={() => void copyOrder()}>複製訂購資料</button>
    </>}
    <div className="form-actions mt-5"><a className="primary-action" href={lineUrl} target="_blank" rel="noopener noreferrer">開啟 LINE 傳送訂單</a><a className="filter-button" href="tel:0919086099">電話訂購 0919-086-099</a><Link className="text-button" href="/#tea-list">繼續選茶</Link></div>
    {feedback && <p role="status" className="mt-3">{feedback}</p>}
    <h2 className="mt-6">匯款資訊</h2><p>中國信託：026540263310</p><p>請先取得陳老師確認的庫存、實際金額及運費，再匯款。</p>
  </section></main>;
}
