"use client";
import { useState } from "react";
import Link from "next/link";
export const PUBLIC_CART_KEY = "chen-tea-public-cart-v1";
export type PublicCartLine = { id: string; name: string; specification: string; price: number; quantity: number };
export function AddTeaToCart({ id, name, specification, price }: Omit<PublicCartLine, "quantity">) {
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState("");
  function add() {
    try {
      const raw = window.localStorage.getItem(PUBLIC_CART_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const cart: PublicCartLine[] = Array.isArray(parsed) ? parsed.filter((line): line is PublicCartLine => Boolean(line) && typeof line.id === "string" && Number.isInteger(line.quantity)) : [];
      const existing = cart.find(line => line.id === id);
      if (existing) existing.quantity = Math.min(30, existing.quantity + qty);
      else cart.push({ id, name, specification, price, quantity: qty });
      window.localStorage.setItem(PUBLIC_CART_KEY, JSON.stringify(cart));
      setNotice("已加入選購清單");
    } catch { setNotice("此瀏覽器無法儲存選購清單，請透過電話或 LINE 訂購。"); }
  }
  return <div className="mt-3">
    <label className="form-field">選購數量
      <select className="form-input" value={qty} onChange={e => setQty(Number(e.target.value))}>
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} 包</option>)}
      </select>
    </label>
    <div className="form-actions mt-3">
      <button className="primary-action" type="button" onClick={add}>加入購物車</button>
      <Link className="filter-button" href="/checkout">前往結帳</Link>
    </div>
    {notice && <p role="status">{notice}</p>}
  </div>;
}
