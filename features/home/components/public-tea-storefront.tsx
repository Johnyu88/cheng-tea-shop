import Link from "next/link";
import type { Product } from "@/lib/domain/types";

const line = "https://line.me/ti/p/TT6TRQyMF6";
export function PublicTeaStorefront({ teas }: { teas: Product[] }) {
  return <div className="site-shell">
    <header className="site-header">
      <Link className="brand-mark" href="/">陳老師茶行</Link>
      <nav aria-label="主要導覽">
        <a href="#tea-list">精選茶品</a>
        <a href="#contact">聯絡訂購</a>
        <Link href="/cart">購物車</Link>
      </nav>
    </header>
    <main>
      <section className="hero">
        <p className="eyebrow">陳老師茶行</p>
        <h1>慢慢選一杯好茶</h1>
        <p className="hero-copy">台灣特色茶品，歡迎透過電話或 LINE 聯絡陳老師選茶。</p>
        <a className="primary-action" href="#tea-list">瀏覽茶品</a>
      </section>
      <section className="teacher-story" aria-labelledby="teacher-story-heading">
        <div className="teacher-story-copy">
          <p className="eyebrow">坐下來，聽陳老師說茶</p>
          <h2 id="teacher-story-heading">先認識泡茶的人，再慢慢找到喜歡的茶。</h2>
          <p>在茶席的氛圍中，慢慢認識茶的香氣與滋味。</p>
        </div>
        <div className="teacher-story-media">
          <picture>
            <source media="(max-width: 40rem)" srcSet="/media/teacher-hero-mobile-candidate.png" />
            <img src="/media/teacher-hero-desktop-candidate.png" alt="陳老師茶行的茶席形象合成照" />
          </picture>
          <div className="teacher-story-audio">
            <p>鳥鳴 2／茶園自然聲景</p>
            <audio aria-label="茶園鳥鳴 2 音效" controls preload="none">
              <source src="/media/tea-stream-birds.wav" type="audio/wav" />
              您的瀏覽器不支援音訊播放。
            </audio>
            <small>請點擊播放；不會自動出聲。</small>
          </div>
        </div>
      </section>
      <section id="tea-list" className="catalog-browser" aria-labelledby="teas-heading">
        <div className="catalog-heading-row"><div><p className="eyebrow">精選茶品</p><h2 id="teas-heading">精選茶品</h2></div><span className="catalog-count">共 {teas.length} 款</span></div>
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
              <Link className="product-link" href={`/tea/${tea.slug}`}>查看茶品／加入購物車</Link>
            </div>
          </article>)}
        </div>
      </section>
      <section id="contact" className="tea-invitation mt-8" aria-labelledby="contact-heading">
        <p className="eyebrow">茶香裡，慢慢聊</p>
        <h2 id="contact-heading">有空，來找陳老師喝杯茶。</h2>
        <p>不趕時間，坐下來聊聊天、聞聞茶香，慢慢找到自己喜歡的好茶。歡迎先來電或透過 LINE 聯絡，約個方便的時間來喝茶。</p>
        <div className="form-actions mt-4">
          <a className="primary-action" href="tel:0919086099">電話約喝茶：0919-086-099</a>
          <a className="filter-button" href={line} target="_blank" rel="noopener noreferrer">LINE 聯絡陳老師</a>
        </div>
        <div className="mt-6">
          <h3>來喝茶的地方</h3>
          <p>427 台中市潭子區潭秀里雅潭路一段38巷2號</p>
          <p className="muted">來訪前歡迎先電話或 LINE 約時間。</p>
          <a className="filter-button mt-3 inline-flex" href="https://maps.app.goo.gl/hu1s5npHJxb1Yghp8?g_st=ic" target="_blank" rel="noopener noreferrer">開啟 Google 地圖導航</a>
        </div>
        <a className="mt-5 inline-block" href={line} target="_blank" rel="noopener noreferrer" aria-label="LINE 聯絡 QR Code">
          <img src="/media/chen-teacher-line-qr.svg" width={160} height={160} alt="陳老師 LINE QR Code"/>
        </a>
        <p className="mt-4">訂購茶品請將購物清單透過 LINE 傳給陳老師，並以電話確認品項、金額與付款方式。</p>
      </section>
    </main>
  </div>;
}
