import type { ReactNode } from "react";
import Link from "next/link";

export function StorefrontShell({ children, homePage = false }: { children: ReactNode; homePage?: boolean }) {
  return (
    <div id={homePage ? "top" : undefined} className="site-shell">
      <header className="site-header" role="banner">
        <Link className="brand-mark" href={homePage ? "#top" : "/"} aria-label="陳老師茶行">
          陳老師茶行
        </Link>
        <nav aria-label={homePage ? "主要導覽" : "前台導覽"}>
          {homePage ? <><Link href="#baseline">茶品導覽</Link><Link href="/orders">訂單查詢</Link></> : <Link href="/" aria-label="回首頁">首頁</Link>}
          <Link href="/#catalog" aria-label="繼續選茶">繼續選茶</Link>
          <Link href="/cart" aria-label="查看購物車">購物車</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
