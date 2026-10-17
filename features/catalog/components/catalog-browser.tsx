"use client";

import { useCallback, useEffect, useState, type JSX } from "react";
import Link from "next/link";
import type { CatalogService, Product, TasteTag } from "@/lib/domain";
import type { TeaCategory } from "@/lib/domain";
import { CategoryFilter } from "./category-filter";

type CatalogBrowserProps = { catalogService: CatalogService };

type CatalogState =
  | { status: "loading"; products: Product[] }
  | { status: "ready"; products: Product[]; nextCursor: string | null; total: number }
  | { status: "empty"; products: Product[] }
  | { status: "error"; products: Product[]; message: string };

const tasteOptions: Array<{ value: TasteTag | undefined; label: string }> = [
  { value: undefined, label: "全部口感" },
  { value: "light", label: "清香" },
  { value: "sweet", label: "甘甜" },
  { value: "rich", label: "濃郁" },
  { value: "roasted", label: "焙火" },
];

function ProductCard({ product }: { product: Product }): JSX.Element {
  const variant = Array.isArray(product.variants) ? product.variants[0] : undefined;

  return (
    <article className="product-card">
      <div className="product-placeholder" role="img" aria-label={product.image.alt}>
        {product.image.src ? <img src={product.image.src} alt={product.image.alt} /> : product.image.alt}
      </div>
      <div className="product-card-content">
        <p className="product-taste">{product.tasteTags.join("・")}</p>
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-summary product-card-summary">{product.summary}</p>
        <p className="product-meta product-card-price">
          {variant?.specification ?? "未設定"}／NT${variant?.price?.amount?.toLocaleString("zh-TW") ?? "—"}
        </p>
        <Link className="product-link button-quiet" href={`/tea/${product.slug}`}>
          查看茶品
        </Link>
      </div>
    </article>
  );
}

export function CatalogBrowser({ catalogService }: CatalogBrowserProps): JSX.Element {
  const [taste, setTaste] = useState<TasteTag | undefined>();
  const [category, setCategory] = useState<TeaCategory | undefined>();
  const [state, setState] = useState<CatalogState>({ status: "loading", products: [] });
  const [requestKey, setRequestKey] = useState(0);

  const loadPage = useCallback(
    async (cursor?: string, append = false) => {
      const query = {
        ...(category === undefined ? {} : { category }),
        ...(taste === undefined ? {} : { taste }),
        ...(cursor === undefined ? {} : { cursor }),
      };
      const result = await catalogService.listProducts(query);
      if (!result.ok) {
        setState((current) => ({ status: "error", products: current.products, message: result.error.message }));
        return;
      }

      setState((current) => {
        const products = append ? [...current.products, ...result.value.items] : result.value.items;
        return products.length === 0
          ? { status: "empty", products: [] }
          : { status: "ready", products, nextCursor: result.value.nextCursor, total: result.value.total };
      });
    },
    [catalogService, category, taste],
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadPage());
  }, [loadPage, requestKey]);

  const chooseTaste = (nextTaste: TasteTag | undefined) => {
    setState({ status: "loading", products: [] });
    setTaste(nextTaste);
    setRequestKey((key) => key + 1);
  };
  const chooseCategory = (nextCategory: TeaCategory | undefined) => {
    setState({ status: "loading", products: [] });
    setCategory(nextCategory);
    setRequestKey((key) => key + 1);
  };

  const retry = () => {
    setState((current) => ({ status: "loading", products: current.products }));
    setRequestKey((key) => key + 1);
  };
  const nextCursor = state.status === "ready" ? state.nextCursor : null;

  return (
    <section className="catalog-browser" aria-labelledby="complete-catalog-heading" id="catalog">
      <div className="catalog-heading-row">
        <div>
          <p className="eyebrow">慢慢找，找到喜歡的味道</p>
          <h2 id="complete-catalog-heading">全部茶品</h2>
        </div>
        {state.status === "ready" && <span className="catalog-count">共 {state.total} 款茶品</span>}
      </div>

      <div className="catalog-filters" role="group" aria-label="依口感篩選">
        {tasteOptions.map((option) => (
          <button
            type="button"
            className="filter-button"
            key={option.label}
            aria-pressed={taste === option.value}
            onClick={() => chooseTaste(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <CategoryFilter value={category} onChange={chooseCategory} />

      {state.status === "loading" && <p role="status">正在整理茶品目錄</p>}
      {state.status === "empty" && (
        <div className="catalog-message" role="status">
          <p>目前找不到符合{category === undefined ? "口感" : "茶類"}的茶品。</p>
          <button type="button" className="text-button" onClick={() => chooseTaste(undefined)}>
            查看全部茶品
          </button>
        </div>
      )}
      {state.status === "error" && (
        <div className="catalog-message" role="alert">
          <p>{state.message}</p>
          <button type="button" className="text-button" onClick={retry}>
            再試一次
          </button>
        </div>
      )}
      {state.products.length > 0 && (
        <>
          <div className="product-grid" aria-live="polite">
            {state.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {nextCursor !== null && (
            <button
              type="button"
              className="load-more-button button-secondary"
              aria-label="載入更多茶品"
              onClick={() => {
                setState((current) => ({ status: "loading", products: current.products }));
                void loadPage(nextCursor, true);
              }}
            >
              載入更多茶品
            </button>
          )}
        </>
      )}
    </section>
  );
}
