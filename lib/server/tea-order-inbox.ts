import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import type { Product } from "@/lib/domain/types";

export type TeaOrderStatus = "new" | "phone-confirmed" | "payment-confirmed" | "shipped";
export type TeaOrderInput = { requestId: string; name: string; phone: string; delivery: "home-delivery" | "store-pickup"; address: string; note: string; lines: {productId: string;variantId: string;quantity: number}[] };
export type TeaOrder = { id: string; number: string; createdAt: string; name: string; phone: string; delivery: string; address: string; note: string; lines: {name:string; specification:string; quantity:number; subtotal:number}[]; subtotal: number; status: TeaOrderStatus; callConfirmedAt:string|null; paymentConfirmedAt:string|null; shippedAt:string|null };
type Row = {id:string;number:string;created_at:string;name:string;phone:string;delivery:string;address:string;note:string;lines_json:string;subtotal:number;status:TeaOrderStatus;call_confirmed_at:string|null;payment_confirmed_at:string|null;shipped_at:string|null};
function open() {
  const path=process.env.PUBLIC_ORDER_INBOX_PATH;
  if (!path || !path.endsWith(".sqlite")) throw Error("訂單服務尚未設定");
  const file=resolve(path);
  mkdirSync(dirname(file),{recursive:true});
  const db=new DatabaseSync(file,{timeout:5000});
  db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000");
  db.exec("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL,number TEXT UNIQUE NOT NULL,created_at TEXT NOT NULL,name TEXT NOT NULL,phone TEXT NOT NULL,delivery TEXT NOT NULL,address TEXT NOT NULL,note TEXT NOT NULL,lines_json TEXT NOT NULL,subtotal INTEGER NOT NULL,status TEXT NOT NULL,call_confirmed_at TEXT,payment_confirmed_at TEXT,shipped_at TEXT)");
  return db;
}
const convert=(r:Row):TeaOrder=>({id:r.id,number:r.number,createdAt:r.created_at,name:r.name,phone:r.phone,delivery:r.delivery,address:r.address,note:r.note,lines:JSON.parse(r.lines_json),subtotal:r.subtotal,status:r.status,callConfirmedAt:r.call_confirmed_at,paymentConfirmedAt:r.payment_confirmed_at,shippedAt:r.shipped_at});
export function placeTeaOrder(input:TeaOrderInput,catalog:Product[]){
  if (!/^[a-f\d-]{36}$/i.test(input?.requestId||"")) throw Error("請重新整理後再送出訂單");
  const name=input.name?.trim(),phone=input.phone?.trim();
  if(!name||name.length>80||!/^09\d{8}$/.test(phone)) throw Error("請填寫姓名及正確手機號碼");
  if(!["home-delivery","store-pickup"].includes(input.delivery))throw Error("請選擇配送方式");
  const address=(input.address||"").trim(),note=(input.note||"").trim();
  if(input.delivery==="home-delivery"&&(address.length<6||address.length>180))throw Error("請填寫完整宅配地址");
  if(note.length>300)throw Error("備註不得超過 300 字");
  if(!Array.isArray(input.lines)||input.lines.length<1||input.lines.length>20)throw Error("購物車內容無效");
  const seen=new Set<string>();
  const lines=input.lines.map(line=>{
    const key=line.productId+":"+line.variantId;
    if(seen.has(key))throw Error("購物車商品重複");seen.add(key);
    const product=catalog.find(x=>x.id===line.productId&&x.publication==="published");
    const v=product?.variants.find(x=>x.id===line.variantId);
    if(!product||!v||v.inventoryStatus!=="available"||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>v.maxQuantity)throw Error("商品已下架、售完或數量不正確，請重新整理購物車");
    return {name:product.name,specification:v.specification,quantity:line.quantity,subtotal:v.price.amount*line.quantity};
  });
  const subtotal=lines.reduce((sum,line)=>sum+line.subtotal,0);
  if(!Number.isSafeInteger(subtotal)||subtotal<0||subtotal>10000000)throw Error("金額不正確");
  const db=open();
  try {
    const old=db.prepare("SELECT number,subtotal FROM orders WHERE request_id=?").get(input.requestId) as {number:string;subtotal:number}|undefined;
    if(old)return old;
    const recent=db.prepare("SELECT count(*) AS n FROM orders WHERE phone=? AND created_at>=?").get(phone,new Date(Date.now()-600000).toISOString()) as {n:number};
    if(recent.n>=3)throw Error("短時間已有多筆訂單，請直接電話與陳老師確認");
    const number="CT"+new Date(Date.now()+8*3600000).toISOString().slice(2,10).replaceAll("-","")+"-"+randomBytes(3).toString("hex").toUpperCase();
    db.prepare("INSERT INTO orders (id,request_id,number,created_at,name,phone,delivery,address,note,lines_json,subtotal,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,'new')").run(randomUUID(),input.requestId,number,new Date().toISOString(),name,phone,input.delivery,address,note,JSON.stringify(lines),subtotal);
    return {number,subtotal};
  }finally{db.close();}
}
export function listTeaOrders():TeaOrder[]{const db=open();try{return (db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200").all() as Row[]).map(convert);}finally{db.close();}}
export function advanceTeaOrder(id:string,action:string):TeaOrder{
  const transitions:Record<TeaOrderStatus,{action:string;status:TeaOrderStatus;column:string}|null>={
    new:{action:"confirm-call",status:"phone-confirmed",column:"call_confirmed_at"},
    "phone-confirmed":{action:"confirm-payment",status:"payment-confirmed",column:"payment_confirmed_at"},
    "payment-confirmed":{action:"ship",status:"shipped",column:"shipped_at"},shipped:null
  };
  const db=open();try{
    const row=db.prepare("SELECT * FROM orders WHERE id=?").get(id) as Row|undefined;
    if(!row)throw Error("找不到訂單");
    const next=transitions[row.status];
    if(!next||action!==next.action)throw Error("請依序電話確認訂單、核對匯款，再確認出貨");
    const updated=db.prepare("UPDATE orders SET status=?, "+next.column+"=? WHERE id=? AND status=?").run(next.status,new Date().toISOString(),id,row.status);
    if(updated.changes!==1)throw Error("訂單狀態已更新，請重新整理");
    return convert(db.prepare("SELECT * FROM orders WHERE id=?").get(id) as Row);
  }finally{db.close();}
}
