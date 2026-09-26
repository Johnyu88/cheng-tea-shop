"use client";

import Link from "next/link";

export function CheckoutExitNav() {
  return <nav aria-label="結帳離開操作" className="mx-auto flex max-w-6xl gap-4 px-5 pt-6 md:px-8"><button className="text-button" type="button" onClick={() => window.history.back()}>返回上一頁</button><Link className="text-button" href="/cart">取消本次結帳</Link></nav>;
}
