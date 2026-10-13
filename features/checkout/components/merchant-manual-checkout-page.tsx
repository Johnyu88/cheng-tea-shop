"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Cart } from "@/lib/domain";
import { useCommerce } from "@/features/commerce/components/commerce-provider";

const lineUrl="https://line.me/ti/p/TT6TRQyMF6";
type Receipt={number:string;subtotal:number};
export function MerchantManualCheckoutPage(){
  const {cartService}=useCommerce();
  const [cart,setCart]=useState<Cart>();
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [delivery,setDelivery]=useState<"home-delivery"|"store-pickup">("home-delivery");
  const [address,setAddress]=useState("");
  const [note,setNote]=useState("");
  const [pending,setPending]=useState(false);
  const [receipt,setReceipt]=useState<Receipt>();
  const [error,setError]=useState("");
  const submissionId=useRef<string>();
  useEffect(()=>{let active=true;void cartService.getCart().then(result=>{if(active){if(result.ok)setCart(result.value);else setError("無法取得購物車，請返回重新選購");}});return()=>{active=false;};},[cartService]);
  async function submit(event:React.FormEvent){
    event.preventDefault();
    if(pending||receipt||!cart?.lines.length)return;
    setPending(true);setError("");
    try{
      submissionId.current ||= crypto.randomUUID();
      const res=await fetch("/api/public/orders",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify({
        requestId:submissionId.current,name,phone,delivery,address:delivery==="home-delivery"?address:"",note,
        lines:cart.lines.map(l=>({productId:l.productId,variantId:l.variantId,quantity:l.quantity}))
      })});
      const result=await res.json() as {ok:boolean;value?:Receipt;error?:string};
      if(!res.ok||!result.ok||!result.value)throw Error(result.error||"送出失敗，請稍後重試");
      setReceipt(result.value);
    }catch(e){setError(e instanceof Error?e.message:"送出失敗");}
    finally{setPending(false);}
  }
  return <main className="py-8 md:py-12">
    <section className="demo-panel" aria-label="送出茶品訂單">
      <p className="eyebrow">陳老師茶行</p>
      {receipt?<section role="status">
        <h1>訂單已送出</h1>
        <p className="mt-4">訂單編號：<strong>{receipt.number}</strong></p>
        <p className="mt-2">參考商品小計：NT${receipt.subtotal.toLocaleString("zh-TW")}</p>
        <p className="mt-4">陳老師會電話與您確認茶品、庫存、運費及最終金額。<strong>請先不要匯款</strong>，待電話確認後再依約定方式付款。</p>
        <p className="mt-3">請保留訂單編號，避免重複送單。</p>
        <div className="form-actions mt-6"><a className="filter-button" href="tel:0919086099">電話聯繫陳老師</a><a className="filter-button" href={lineUrl}>LINE 聯絡</a><Link className="text-button" href="/">回首頁</Link></div>
      </section>:<>
        <h1>送出茶品訂單</h1>
        <p className="mt-3">填寫聯絡資料後，訂購清單會直接進入陳老師的私人後台。陳老師會電話確認，確認前無需匯款。</p>
        {error&&<p className="product-draft-alert mt-4" role="alert">{error}</p>}
        {!cart?<p role="status">正在載入購物車…</p>:cart.lines.length===0?<><p className="mt-4">目前購物車是空的。</p><Link className="filter-button mt-4 inline-flex" href="/">繼續選茶</Link></>:<>
          <h2 className="mt-6">您的茶品清單</h2>
          <ul className="mt-3 grid gap-2">{cart.lines.map(l=><li key={l.productId+":"+l.variantId}><strong>{l.productName}</strong>／{l.specification} × {l.quantity} — NT${(l.unitPrice.amount*l.quantity).toLocaleString("zh-TW")}</li>)}</ul>
          <p className="mt-4 font-bold">商品小計：NT${cart.subtotal.amount.toLocaleString("zh-TW")}（運費與金額由老師電話確認）</p>
          <form onSubmit={e=>void submit(e)} className="mt-6 grid gap-4">
            <label className="form-field">訂購人姓名<input className="form-input" autoComplete="name" required maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label>
            <label className="form-field">聯絡手機<input className="form-input" autoComplete="tel" type="tel" inputMode="tel" pattern="09[0-9]{8}" required maxLength={10} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}/></label>
            <fieldset className="form-fieldset"><legend>取貨方式</legend>
              <label className="form-option"><input type="radio" checked={delivery==="home-delivery"} onChange={()=>setDelivery("home-delivery")}/>宅配</label>
              <label className="form-option"><input type="radio" checked={delivery==="store-pickup"} onChange={()=>setDelivery("store-pickup")}/>到店取貨</label>
            </fieldset>
            {delivery==="home-delivery"&&<label className="form-field">配送地址<textarea className="form-textarea" autoComplete="street-address" required minLength={6} maxLength={180} value={address} onChange={e=>setAddress(e.target.value)}/></label>}
            <label className="form-field">備註（選填）<textarea className="form-textarea" maxLength={300} rows={3} value={note} onChange={e=>setNote(e.target.value)}/></label>
            <button className="primary-action" type="submit" disabled={pending}>{pending?"正在送出…":"送出訂單給陳老師"}</button>
          </form>
          <p className="muted mt-4">送單不會直接扣款，也不代表老師已接單。個人資料僅供這次訂購聯繫和配送使用。</p>
        </>}
      </>}
    </section>
  </main>;
}
