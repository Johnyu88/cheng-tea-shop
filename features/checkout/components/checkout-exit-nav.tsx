"use client";

import Link from "next/link";

export function CheckoutExitNav() {
  return <nav aria-label="結帳離開選項" className="checkout-exit-nav mx-auto flex max-w-6xl gap-4 px-5 pt-6 md:px-8"><button className="filter-button" type="button" onClick={() => window.history.back()}>返回上一頁</button><Link className="filter-button" href="/cart">返回購物車</Link></nav>;
}
