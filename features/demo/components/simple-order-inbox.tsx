"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import type {TeaOrder,TeaOrderStatus} from "@/lib/server/tea-order-inbox";

const labels:Record<TeaOrderStatus,string>={new:"待電話確認","phone-confirmed":"待核對匯款","payment-confirmed":"已收款／待出貨",shipped:"已出貨"};
const actions:Record<TeaOrderStatus,{label:string;key:string}|null>={
 new:{label:"已電話確認訂單",key:"confirm-call"},
 "phone-confirmed":{label:"已電話核對收款",key:"confirm-payment"},
 "payment-confirmed":{label:"確認出貨",key:"ship"},
 shipped:null
};
type ResponseEnvelope<T>={ok:boolean;value?:T;error?:string};
async function api<T>(method:"GET"|"POST",body?:object):Promise<T>{
 const response=await fetch("/api/merchant/order-inbox",{method,credentials:"same-origin",headers:body?{"content-type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined,cache:"no-store"});
 const payload=await response.json() as ResponseEnvelope<T>;
 if(!response.ok||!payload.ok||payload.value===undefined)throw Error(payload.error||"無法取得訂單");
 return payload.value;
}
export function SimpleOrderInbox(){
 const [orders,setOrders]=useState<TeaOrder[]>([]);
 const [filter,setFilter]=useState<"pending"|"all">("pending");
 const [openId,setOpenId]=useState<string>();
 const [error,setError]=useState("");
 const [busy,setBusy]=useState<string>();
 const [loading,setLoading]=useState(true);
 const refresh=async()=>{try{setError("");setOrders(await api<TeaOrder[]>("GET"));}catch(e){setError(e instanceof Error?e.message:"請重新登入");}finally{setLoading(false);}};
 useEffect(()=>{void refresh();},[]);
 async function advance(order:TeaOrder){
   const action=actions[order.status];if(!action||busy)return;
   if(!window.confirm("確認「"+order.number+"」："+action.label+"？此操作會記錄時間。"))return;
   setBusy(order.id);
   try{await api<TeaOrder>("POST",{id:order.id,action:action.key});await refresh();}
   catch(e){setError(e instanceof Error?e.message:"操作失敗");}
   finally{setBusy(undefined);}
 }
 const shown=orders.filter(o=>filter==="all"||o.status!=="shipped");
 const outstanding=orders.filter(o=>o.status!=="shipped").length;
 return <main className="py-8 md:py-12"><section className="demo-panel">
  <p className="eyebrow">陳老師茶行</p><h1>訂購清單</h1>
  <p className="mt-2">先電話確認訂單，再確認匯款。未確認收款前不能標示出貨。</p>
  <div className="form-actions mt-4"><Link className="filter-button" href="/admin/products">商品管理</Link><button className="filter-button" type="button" onClick={()=>void refresh()}>重新整理訂單</button></div>
  <div className="form-actions mt-4">
    <button type="button" className={filter==="pending"?"primary-action":"filter-button"} onClick={()=>setFilter("pending")}>待處理（{outstanding}）</button>
    <button type="button" className={filter==="all"?"primary-action":"filter-button"} onClick={()=>setFilter("all")}>全部訂單（{orders.length}）</button>
  </div>
  {error&&<p className="product-draft-alert mt-4" role="alert">{error}。如果登入逾時，請先到商品管理重新登入後返回。</p>}
  {loading?<p role="status" className="mt-4">正在載入訂單…</p>:shown.length===0?<p className="mt-6">目前沒有{filter==="pending"?"待處理":""}訂單。</p>:<div className="mt-5 grid gap-3">
    {shown.map(o=><article key={o.id} className="rounded-xl border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>{labels[o.status]}</strong><time className="text-sm" dateTime={o.createdAt}>{new Date(o.createdAt).toLocaleString("zh-TW",{timeZone:"Asia/Taipei"})}</time></div>
      <p className="mt-2"><strong>#{o.number}</strong>　{o.name}</p>
      <p className="mt-1">{o.lines.map(l=>l.name+" × "+l.quantity).join("、")}</p>
      <p className="mt-2 font-bold">商品小計 NT${o.subtotal.toLocaleString("zh-TW")}</p>
      <div className="form-actions mt-3">
       <a className="filter-button" href={"tel:"+o.phone}>撥打電話</a>
       <button className="filter-button" type="button" aria-expanded={openId===o.id} onClick={()=>setOpenId(openId===o.id?undefined:o.id)}>{openId===o.id?"收合明細":"查看明細"}</button>
      </div>
      {openId===o.id&&<section className="mt-4 border-t border-black/10 pt-3" aria-label={"訂單 "+o.number+" 明細"}>
       <p>訂購人：{o.name}／{o.phone}</p>
       <p>取貨：{o.delivery==="home-delivery"?"宅配 "+o.address:"到店取貨"}</p>
       {o.note&&<p>備註：{o.note}</p>}
       <ul className="mt-3 grid gap-2">{o.lines.map((l,i)=><li key={i}>{l.name}／{l.specification} × {l.quantity}　NT${l.subtotal.toLocaleString("zh-TW")}</li>)}</ul>
       <p className="mt-2">電話確認：{o.callConfirmedAt?"已確認":"待確認"}</p>
       <p>匯款確認：{o.paymentConfirmedAt?"已由老師確認":"待確認"}</p>
       {actions[o.status]&&<button className="primary-action mt-4" disabled={busy===o.id} onClick={()=>void advance(o)}>{busy===o.id?"處理中…":actions[o.status]!.label}</button>}
      </section>}
    </article>)}
  </div>}
 </section></main>;
}
