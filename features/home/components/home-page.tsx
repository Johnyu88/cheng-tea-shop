import type { JSX } from "react";

export function HomePage(): JSX.Element {
  return (
    <div id="top" className="site-shell">
      <header className="site-header" role="banner">
        <a className="brand-mark" href="#top" aria-label="龍映茗茶">
          龍映茗茶
        </a>
        <nav aria-label="主要導覽">
          <a href="#baseline">茶品導覽</a>
        </nav>
      </header>

      <main>
        <section className="hero" aria-labelledby="storefront-heading">
          <p className="eyebrow">陳老師茶行</p>
          <h1 id="storefront-heading">慢慢選一杯好茶</h1>
          <p className="hero-copy">從喜歡的香氣與口感開始，不必先懂茶，也能找到適合自己的茶。</p>
          <a className="primary-action" href="#baseline">開始選茶</a>
        </section>

        <section className="baseline-card" aria-labelledby="baseline-heading" id="baseline">
          <h2 id="baseline-heading">Wave 1 技術基線</h2>
          <p>這是龍映茗茶 Wave 1 的技術基線，後續功能會在通過驗證後逐步加入。</p>
        </section>
      </main>
    </div>
  );
}
