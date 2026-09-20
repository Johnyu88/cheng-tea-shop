"use client";

import { useEffect, useState, type JSX } from "react";
import Image from "next/image";
import type { CatalogService, Product } from "@/lib/domain";
import { createMockCatalogService } from "@/lib/domain";
import { CatalogBrowser } from "@/features/catalog/components/catalog-browser";

type HomePageProps = {
  catalogService?: CatalogService;
};

type CatalogState =
  | { status: "loading" }
  | { status: "ready"; products: Product[] }
  | { status: "empty" }
  | { status: "error"; message: string };

const defaultCatalogService = createMockCatalogService();

function CatalogPreview({ catalogService }: { catalogService: CatalogService }): JSX.Element {
  const [state, setState] = useState<CatalogState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    void catalogService.listProducts({ limit: 3 }).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setState({ status: "error", message: result.error.message });
        return;
      }
      setState(result.value.items.length === 0 ? { status: "empty" } : { status: "ready", products: result.value.items });
    });

    return () => {
      active = false;
    };
  }, [catalogService]);

  return (
    <section className="catalog-preview" aria-labelledby="catalog-heading" id="baseline">
      <div className="catalog-heading-row">
        <div>
          <p className="eyebrow">從喜歡的口感開始</p>
          <h2 id="catalog-heading">推薦茶品</h2>
        </div>
        <span className="catalog-count">先看三款</span>
      </div>

      {state.status === "loading" && <p role="status">正在整理茶品</p>}
      {state.status === "empty" && <p role="status">目前還沒有可展示的茶品。</p>}
      {state.status === "error" && <p role="alert">{state.message}</p>}
      {state.status === "ready" && (
        <div className="product-grid">
          {state.products.map((product) => {
            const variant = product.variants[0];
            return (
              <article className="product-card" key={product.id}>
                <div className="product-placeholder" role="img" aria-label={product.image.alt}>
                  {product.image.alt}
                </div>
                <div className="product-card-content">
                  <p className="product-taste">{product.tasteTags.join("・")}</p>
                  <h3>{product.name}</h3>
                  <p className="product-summary">{product.summary}</p>
                  <p className="product-meta">
                    {variant?.specification}／NT${variant?.price.amount.toLocaleString("zh-TW")}
                  </p>
                  <span className="product-link">查看茶品</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function HomePage({ catalogService = defaultCatalogService }: HomePageProps): JSX.Element {
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

        <section className="teacher-story" aria-labelledby="teacher-story-heading">
          <div className="teacher-story-copy">
            <p className="eyebrow">坐下來，聽陳老師說茶</p>
            <h2 id="teacher-story-heading">先認識泡茶的人，再慢慢找到喜歡的茶。</h2>
            <p>
              這裡保留陳老師在茶行裡的照片與一段短片，讓第一次來的客人先感受到這間茶行的溫度。
            </p>
          </div>
          <div className="teacher-story-media">
            <Image
              src="/media/teacher-portrait.webp"
              alt="陳老師在茶行裡的照片"
              width={1200}
              height={1600}
              sizes="(max-width: 40rem) 100vw, 40vw"
            />
            <video
              aria-label="陳老師茶行介紹影片"
              controls
              muted
              playsInline
              preload="metadata"
              poster="/media/teacher-portrait.webp"
            >
              <source src="/media/teacher-story.mp4" type="video/mp4" />
              您的瀏覽器不支援影片播放。
            </video>
          </div>
        </section>

        <CatalogPreview catalogService={catalogService} />
        <CatalogBrowser catalogService={catalogService} />
      </main>
    </div>
  );
}
