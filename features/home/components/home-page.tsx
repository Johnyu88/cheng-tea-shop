"use client";

import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import type { CatalogService, Product } from "@/lib/domain";
import { createDemoCatalogService, createMockCatalogService } from "@/lib/domain";
import { publicTeaCatalogService } from "@/lib/domain/in-memory-adapters";
import { CatalogBrowser } from "@/features/catalog/components/catalog-browser";
import { StorefrontShell } from "@/features/storefront/components/storefront-shell";

type HomePageProps = {
  catalogService?: CatalogService;
};

type CatalogState =
  | { status: "loading" }
  | { status: "ready"; products: Product[] }
  | { status: "empty" }
  | { status: "error"; message: string };

const defaultCatalogService = process.env.NEXT_PUBLIC_DEMO_COMMERCE === "enabled" ? createDemoCatalogService() : createMockCatalogService();

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
            const variant = Array.isArray(product.variants) ? product.variants[0] : undefined;
            return (
              <article className="product-card" key={product.id}>
              <div className="product-placeholder" role="img" aria-label={product.image.alt}>
                {product.image.src ? <img src={product.image.src} alt={product.image.alt} /> : product.image.alt}
                </div>
                <div className="product-card-content">
                  <p className="product-taste">{product.tasteTags.join("・")}</p>
                  <h3>{product.name}</h3>
                  <p className="product-summary">{product.summary}</p>
                  <p className="product-meta">
                    {variant?.specification ?? "未設定"}／NT${variant?.price?.amount?.toLocaleString("zh-TW") ?? "—"}
                  </p>
                  <Link className="product-link" href={`/tea/${product.slug}`}>
                    查看茶品
                  </Link>
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
    <StorefrontShell homePage>
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
              認識陳老師茶行的茶席風景，歡迎透過電話或 LINE 詢問茶品。
            </p>
          </div>
          <div className="teacher-story-media">
            <picture>
              <source media="(max-width: 40rem)" srcSet="/media/teacher-hero-mobile-candidate.png" />
              <img src="/media/teacher-hero-desktop-candidate.png" srcSet="/media/teacher-hero-mobile-candidate.png 640w" alt="陳老師茶行首頁合成照" />
            </picture>
            <div className="teacher-story-audio">
              <p>鳥鳴 2／茶園自然聲景</p>
              <audio aria-label="茶園鳥鳴 2 音效" controls preload="metadata">
                <source src="/media/tea-stream-birds.wav" type="audio/wav" />
                您的瀏覽器不支援音訊播放。
              </audio>
              <small>請點擊播放；不會自動出聲。</small>
            </div>
          </div>
        </section>

        <CatalogPreview catalogService={catalogService} />
        <CatalogBrowser catalogService={catalogService} />
        <section className="demo-panel mt-8" aria-labelledby="merchant-contact-title">
          <h2 id="merchant-contact-title">聯絡陳老師</h2>
          <p>選茶、匯款確認或訂購諮詢，歡迎直接聯絡。</p>
          <div className="form-actions mt-4">
            <a className="primary-action" href="tel:0919086099">電話 0919-086-099</a>
            <a className="filter-button" href="https://line.me/ti/p/TT6TRQyMF6" target="_blank" rel="noopener noreferrer">LINE 聯絡陳老師</a>
          </div>
          <a href="https://line.me/ti/p/TT6TRQyMF6" target="_blank" rel="noopener noreferrer" aria-label="掃描 LINE QR Code 聯絡陳老師">
            <img src="/media/chen-teacher-line-qr.svg" width={160} height={160} alt="陳老師 LINE QR Code" />
          </a>
        </section>
      </main>
    </StorefrontShell>
  );
}
