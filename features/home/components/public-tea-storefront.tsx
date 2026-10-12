import Link from "next/link";
import { confirmedTeaFixture } from "@/lib/domain/mock/confirmed-tea-fixture";

const line = "https://line.me/ti/p/TT6TRQyMF6";
export function PublicTeaStorefront() {
  const teas = confirmedTeaFixture.filter(p => p.publication === "published");
  return <div className="site-shell">
    <header className="site-header">
      <Link className="brand-mark" href="/">陳老師茶行</Link>
      <nav aria-label="主要導覽">
        <a href="#tea-list">精選茶品</a>
        <a href="#contact">聯絡訂購</a>
      </nav>
    </header>
    <main>
      <section className="hero">
        <p className="eyebrow">陳老師茶行</p>
        <h1>慢慢選一杯好茶</h1>
        <p className="hero-copy">台灣特色茶品，歡迎透過電話或 LINE 聯絡陳老師選茶。</p>
        <a className="primary-action" href="#tea-list">瀏覽茶品</a>
      </section>
      <section id="tea-list" className="catalog-browser" aria-labelledby="teas-heading">
        <div className="catalog-heading-row"><div><p className="eyebrow">精選茶品</p><h2 id="teas-heading">八款茶品</h2></div><span className="catalog-count">共 {teas.length} 款</span></div>
        <p className="muted">茶名、規格與參考價格依既有茶樣資料整理；實際價格與供貨以陳老師確認為準。</p>
        <div className="product-grid">
          {teas.map(tea => <article className="product-card" key={tea.id}>
            <div className="product-placeholder" role="img" aria-label={tea.image.alt}>
              {tea.image.src ? <img src={tea.image.src} alt={tea.image.alt} loading="lazy"/> : <p>請洽陳老師確認照片</p>}
            </div>
            <div className="product-card-content">
              <p className="product-taste">{tea.tasteTags.join("・")}</p>
              <h3>{tea.name}</h3>
              <p className="product-summary">{tea.summary}</p>
              <p className="product-meta">{tea.variants[0]?.specification}／參考價 NT${tea.variants[0]?.price.amount.toLocaleString("zh-TW")}</p>
              <a className="product-link" href={line} target="_blank" rel="noopener noreferrer">向陳老師詢問</a>
            </div>
          </article>)}
        </div>
      </section>
      <section id="contact" className="demo-panel mt-8" aria-labelledby="contact-heading">
        <h2 id="contact-heading">電話與 LINE 訂購</h2>
        <p>請先確認茶品、運費與實際金額，再依店家確認方式付款。</p>
        <div className="form-actions mt-4">
          <a className="primary-action" href="tel:0919086099">電話 0919-086-099</a>
          <a className="filter-button" href={line} target="_blank" rel="noopener noreferrer">LINE 聯絡陳老師</a>
        </div>
        <a href={line} target="_blank" rel="noopener noreferrer" aria-label="LINE 聯絡 QR Code">
          <img src="/media/chen-teacher-line-qr.svg" width={160} height={160} alt="陳老師 LINE QR Code"/>
        </a>
        <p>匯款銀行：中國信託；帳號：026540263310。請先由店家確認訂單金額後再匯款。</p>
      </section>
    </main>
  </div>;
}
