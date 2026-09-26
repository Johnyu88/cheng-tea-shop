"use client";

import Link from "next/link";
import { useEffect, useState, type JSX } from "react";
import type { Product } from "@/lib/domain";

type Envelope<T> = { ok: true; value: T } | { ok: false; error: string };

async function loadProducts(): Promise<Product[]> {
  const response = await fetch("/api/demo/catalog?limit=50&includeUnpublished=true", { credentials: "same-origin" });
  const payload = await response.json() as Envelope<{ items: Product[] }>;
  if (!response.ok || !payload.ok) throw new Error(payload.ok ? "商品資料無法取得" : payload.error);
  return payload.value.items;
}

async function setPublication(id: string, publication: Product["publication"]): Promise<Product> {
  const response = await fetch("/api/demo/catalog", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, publication }) });
  const payload = await response.json() as Envelope<Product>;
  if (!response.ok || !payload.ok) throw new Error(payload.ok ? "商品狀態更新失敗" : payload.error);
  return payload.value;
}

export function ProductAdminPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string>();

  const refresh = () => { void loadProducts().then(setProducts).catch((caught) => setError(caught instanceof Error ? caught.message : "商品資料無法取得")); };
  useEffect(refresh, []);

  const toggle = async (product: Product) => {
    setBusy(product.id); setError("");
    try {
      const updated = await setPublication(product.id, product.publication === "published" ? "draft" : "published");
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "商品狀態更新失敗"); }
    finally { setBusy(undefined); }
  };

  return <main className="product-draft-page py-8 md:py-12"><section className="product-draft-card" aria-labelledby="product-admin-heading"><p className="eyebrow">本機 Demo 商品工作台</p><h1 id="product-admin-heading">商品管理</h1><p className="prototype-notice">此工作台只保存本機合成資料，沒有正式管理員驗證，不會連接 ERP。</p><div className="form-actions"><Link className="primary-action" href="/admin/products/new">新增商品</Link><button className="filter-button" type="button" onClick={refresh}>重新整理</button></div>{error && <p role="alert">{error}</p>}<div className="product-admin-list" aria-label="商品清單">{products.map((product) => { const variant = product.variants[0]; const published = product.publication === "published"; return <article className="product-admin-item" key={product.id}><div role="img" aria-label={product.image.alt}>{product.image.src ? <img src={product.image.src} alt={product.image.alt} /> : product.image.alt}</div><div><h2>{product.name}</h2><p>類別：{product.category}</p><p>規格：{variant?.specification ?? "未設定"}／NT${variant?.price.amount.toLocaleString("zh-TW") ?? "—"}</p><p>庫存狀態：{variant?.inventoryStatus === "available" ? "有貨" : "售完"}</p><p>上架狀態：{published ? "上架中" : "已下架"}</p><div className="form-actions"><Link className="text-button" href={`/tea/${product.slug}`}>查看前台</Link><button className="filter-button" type="button" disabled={busy === product.id} onClick={() => void toggle(product)}>{busy === product.id ? "更新中" : published ? "下架" : "重新上架"}</button></div></div></article>; })}</div></section></main>;
}
