"use client";

import Link from "next/link";
import { useEffect, useState, type JSX } from "react";
import type { Product } from "@/lib/domain";
import { initialDraft, minimumProblems, ProductFields, type FormDraft } from "./product-form";

type Envelope<T> = { ok: true; value: T } | { ok: false; error: string };
const categoryLabels: Record<Product["category"], string> = { "wild-mountain": "台灣野生山茶", white: "白茶", green: "綠茶", yellow: "黃茶", oolong: "青茶", black: "紅茶", flower: "花茶", dark: "黑茶", special: "特殊茶", aged: "老茶", other: "其他" };

async function loadProducts(): Promise<Product[]> { const response = await fetch("/api/demo/catalog?limit=50&includeUnpublished=true", { credentials: "same-origin" }); const payload = await response.json() as Envelope<{ items: Product[] }>; if (!response.ok || !payload.ok) throw new Error(payload.ok ? "商品資料無法取得" : payload.error); return [...payload.value.items].reverse(); }
async function patchProduct(body: Record<string, unknown>): Promise<Product> { const response = await fetch("/api/demo/catalog", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const payload = await response.json() as Envelope<Product>; if (!response.ok || !payload.ok) throw new Error(payload.ok ? "商品更新失敗" : payload.error); return payload.value; }

function draftFromProduct(product: Product): FormDraft { const variant = product.variants[0]; return { ...initialDraft, name: product.name, specification: variant?.specification ?? "", price: String(variant?.price.amount ?? ""), category: product.category, inventoryStatus: variant?.inventoryStatus ?? "available", tasteTags: [...product.tasteTags], summary: product.summary, aroma: product.aroma ?? "", taste: product.taste ?? "", origin: product.teaRegion ?? "" }; }

export function ProductManagementPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string>();
  const [draft, setDraft] = useState<FormDraft>(initialDraft);
  const [busy, setBusy] = useState<string>();
  const [photoDataUrl, setPhotoDataUrl] = useState<string>();
  const [photoReading, setPhotoReading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const refresh = () => { void loadProducts().then(setProducts).catch((caught) => setError(caught instanceof Error ? caught.message : "商品資料無法取得")); };
  useEffect(refresh, []);
  const change = <Key extends keyof FormDraft>(key: Key, value: FormDraft[Key]) => setDraft((current) => ({ ...current, [key]: value }));
  const edit = (product: Product) => { setEditingId(product.id); setDraft(draftFromProduct(product)); setPhotoDataUrl(undefined); setPhotoReading(false); setNotice(""); setError(""); };
  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) { setPhotoDataUrl(undefined); setError("請選擇 JPEG、PNG 或 WebP 照片，最大 5MB。原照片未更動。"); return; }
    setPhotoReading(true); setError("");
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setPhotoDataUrl(reader.result); else setError("照片讀取失敗，原照片未更動。"); setPhotoReading(false); };
    reader.onerror = () => { setError("照片讀取失敗，原照片未更動。"); setPhotoReading(false); };
    reader.readAsDataURL(file);
  };
  const save = async (product: Product) => { const problems = minimumProblems(draft); if (problems.length > 0) { setError(problems.map((problem) => problem.message).join(" ")); return; } setBusy(product.id); setError(""); try { const updated = await patchProduct({ id: product.id, name: draft.name.trim(), category: draft.category, specification: draft.specification.trim(), price: { currency: "TWD", amount: Number(draft.price) }, inventoryStatus: draft.inventoryStatus, aroma: draft.aroma, taste: draft.taste, teaRegion: draft.origin, summary: draft.summary, ...(photoDataUrl ? { imageDataUrl: photoDataUrl } : {}) }); setProducts((current) => current.map((item) => item.id === updated.id ? updated : item)); setEditingId(undefined); setPhotoDataUrl(undefined); setNotice(`「${updated.name}」資料${photoDataUrl ? "與照片" : ""}已儲存。`); } catch (caught) { setError(caught instanceof Error ? caught.message : "商品更新失敗"); } finally { setBusy(undefined); } };
  const toggle = async (product: Product) => { setBusy(product.id); setError(""); try { const updated = await patchProduct({ id: product.id, publication: product.publication === "published" ? "draft" : "published" }); setProducts((current) => current.map((item) => item.id === updated.id ? updated : item)); } catch (caught) { setError(caught instanceof Error ? caught.message : "商品狀態更新失敗"); } finally { setBusy(undefined); } };

  return <main className="product-draft-page py-8 md:py-12"><section className="product-draft-card" aria-labelledby="product-management-heading"><p className="eyebrow">本機 Demo 商品工作台</p><h1 id="product-management-heading">商品管理</h1><p className="prototype-notice">新增與編輯共用同一組欄位與驗證；照片由店家自行準備後上傳，不使用內建影像 AI。</p><nav className="form-actions" aria-label="後台快速導覽"><Link className="primary-action" href="/">前往購物前台</Link><Link className="filter-button" href="/admin/products/new">新增商品</Link><button className="filter-button" type="button" onClick={refresh}>重新整理商品清單</button></nav>{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}<p role="status" aria-live="polite">共 {products.length} 筆商品，其中 {products.filter((product) => product.publication === "draft").length} 筆未上架。新加入的商品顯示在最前面。</p><div className="product-admin-list" aria-label="商品清單">{products.map((product) => { const variant = product.variants[0]; const editing = editingId === product.id; return <article className="product-admin-item" key={product.id}><div role="img" aria-label={product.image.alt}>{product.image.src ? <img src={product.image.src} alt={product.image.alt} /> : product.image.alt}</div><div><h2>{product.name}</h2><p>類別：{categoryLabels[product.category]}</p><p>規格：{variant?.specification ?? "未設定"}／NT${variant?.price.amount.toLocaleString("zh-TW") ?? "—"}</p><p>庫存狀態：{variant?.inventoryStatus === "available" ? "有貨" : "售完"}</p><p>上架狀態：{product.publication === "published" ? "上架中" : "草稿／未上架（顧客看不到）"}</p><div className="form-actions"><Link className="text-button" href={`/tea/${product.slug}`}>查看前台</Link><button className="text-button" type="button" onClick={() => editing ? setEditingId(undefined) : edit(product)}>編輯</button><button className="filter-button" type="button" disabled={busy === product.id} onClick={() => void toggle(product)}>{busy === product.id ? "更新中" : product.publication === "published" ? "下架" : "上架"}</button></div>{editing && <form className="product-admin-edit" onSubmit={(event) => { event.preventDefault(); if (window.confirm(`確認修改「${product.name}」？\n新價格：NT$${draft.price}\n${photoDataUrl ? "將更換商品照片。" : "保留原照片。"}\n請確認不是其他茶品。`)) void save(product); }}><h3>目前編輯：{product.name}</h3><p role="status">商品編號：{product.id}／原價格：NT${variant?.price.amount}／新價格：NT${draft.price || "尚未輸入"}</p><ProductFields draft={draft} onChange={change} idPrefix={`edit-${product.id}`} /><div className="form-field"><p><strong>目前已儲存的商品照片</strong>（重新進入編輯仍會顯示）</p>{product.image.src ? <img src={product.image.src} alt={`目前照片：${product.name}`} style={{ maxWidth: 240, width: "100%", height: "auto" }} /> : <p>目前尚未上傳商品照片。</p>}<label htmlFor={`photo-${product.id}`}>選擇新照片以更換（JPEG、PNG、WebP，最多5MB）</label><input id={`photo-${product.id}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0])} /><p>選好照片會先預覽，按「儲存編輯」才會正式更換。未選照片則保留原照片。</p>{photoReading && <p role="status">正在讀取照片…</p>}{photoDataUrl && <div><img src={photoDataUrl} alt="新照片預覽（尚未儲存）" style={{ maxWidth: 240, width: "100%", height: "auto" }} /><button type="button" className="text-button" onClick={() => setPhotoDataUrl(undefined)}>取消更換照片</button></div>}</div><p className="field-help">原有照片與歷史訂單會保留；本機 Demo 使用同一份 Catalog Store。</p><button className="primary-action" type="submit" disabled={busy === product.id || photoReading}>{busy === product.id ? "儲存中" : "儲存編輯"}</button></form>}</div></article>; })}</div></section></main>;
}
