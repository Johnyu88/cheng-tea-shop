import Link from "next/link";

const entries = [
  { href: "/?pwa=storefront", icon: "/icons/tea-store-192.png", name: "陳老師茶行", detail: "前台首頁與購物" },
  { href: "/admin/products?pwa=products", icon: "/icons/tea-products-192.png", name: "陳老師茶行商品管理", detail: "商品、價格、庫存與圖片" },
  { href: "/admin/orders?pwa=orders", icon: "/icons/tea-orders-192.png", name: "陳老師茶行訂單管理", detail: "付款、包裝與出貨" },
];

export default function InstallPage() {
  return <main className="py-8"><section className="demo-panel">
    <h1>茶行手機入口</h1>
    <p>請使用 Android 上的 Chrome，逐一開啟下列入口。管理入口登入後共用同一個商家 Session 與 Passkey。</p>
    <ol>{entries.map(entry => <li key={entry.href} className="mt-4">
      <Link className="filter-button inline-flex items-center gap-3" href={entry.href}>
        <img src={entry.icon} alt="" width="48" height="48" />
        <span><strong>{entry.name}</strong><br />{entry.detail}</span>
      </Link>
    </li>)}</ol>
    <h2 className="mt-8">Samsung 手機安裝</h2>
    <ol>
      <li>先安裝商品管理與訂單管理，再安裝前台；同一 HTTPS 網域的巢狀 PWA 可能被 Chrome 合併辨識。</li>
      <li>每個入口都在 Chrome 開啟自己的網址，按右上角 ⋮，選「安裝應用程式」或「加到主畫面」。</li>
      <li>若顯示「加到主畫面」捷徑，照常加入；三個入口各自操作一次。捷徑會使用該頁的名稱與圖示。</li>
      <li>回到主畫面，逐一點開三個圖示並重新啟動，確認仍到該入口。管理入口只可由商家 Session 使用。</li>
    </ol>
    <p className="prototype-notice mt-6">同一網域下的 PWA 共用網站資料與登入 Cookie。若 Chrome 將它們顯示成同一個應用程式，請使用各入口網址建立固定桌面捷徑；不可把後台網址分享給未授權者。</p>
  </section></main>;
}
