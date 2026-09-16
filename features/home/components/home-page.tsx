import type { JSX } from "react";

export function HomePage(): JSX.Element {
  return (
    <main>
      <section aria-labelledby="storefront-heading">
        <h1 id="storefront-heading">慢慢選一杯好茶</h1>
        <p>從喜歡的香氣與口感開始，不必先懂茶，也能找到適合自己的茶。</p>
        <a href="#baseline">開始選茶</a>
      </section>

      <section aria-labelledby="baseline-heading" id="baseline">
        <h2 id="baseline-heading">Wave 1 技術基線</h2>
        <p>這是龍映茗茶 Wave 1 的技術基線，後續功能會在通過驗證後逐步加入。</p>
      </section>
    </main>
  );
}
