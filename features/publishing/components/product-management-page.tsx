"use client";

import Link from "next/link";
import { Component, useEffect, useState, type JSX, type ReactNode } from "react";
import type { Product } from "@/lib/domain";
import { demoApi, type DemoMerchantStatus } from "@/features/demo/demo-api";
import { AdminPasskeyLogin } from "@/features/demo/components/admin-passkey-login";
import { reportAdminProductsApi, reportAdminProductsApiError, reportAdminProductsReactMounted } from "../diagnostics/admin-products-diagnostic";
import { preparePhotoDataUrl } from "@/lib/client/prepare-photo";
import { initialDraft, minimumProblems, ProductFields, type FormDraft } from "./product-form";

type Envelope<T> = { ok: true; value: T } | { ok: false; error: string };
const categoryLabels: Record<Product["category"], string> = { "wild-mountain": "台灣野生山茶", white: "白茶", green: "綠茶", yellow: "黃茶", oolong: "青茶", black: "紅茶", flower: "花茶", dark: "黑茶", special: "特殊茶", aged: "老茶", other: "其他" };

async function loadProducts(): Promise<Product[]> { const started = performance.now(); try { const response = await fetch("/api/demo/catalog?limit=50&includeUnpublished=true", { credentials: "same-origin" }); reportAdminProductsApi("catalog", { status: response.status, contentType: response.headers.get("content-type") ?? "", durationMs: Math.round(performance.now() - started) }); const payload = await response.json() as Envelope<{ items: Product[] }>; if (!response.ok || !payload.ok) throw new Error(payload.ok ? "商品資料無法取得" : payload.error); return [...payload.value.items].reverse(); } catch (caught) { reportAdminProductsApiError("catalog", { errorType: caught instanceof Error ? caught.name : "UnknownError", durationMs: Math.round(performance.now() - started) }); throw caught; } }
async function deleteProduct(id: string): Promise<void> { const response = await fetch("/api/demo/catalog", { method: "DELETE", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }); const payload = await response.json() as Envelope<{ id: string }>; if (!response.ok || !payload.ok) throw new Error(payload.ok ? "商品刪除失敗" : payload.error); }
async function patchProduct(body: Record<string, unknown>): Promise<Product> { const response = await fetch("/api/demo/catalog", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const payload = await response.json() as Envelope<Product>; if (!response.ok || !payload.ok) throw new Error(payload.ok ? "商品更新失敗" : payload.error); return payload.value; }

function draftFromProduct(product: Product): FormDraft { const variant = Array.isArray(product.variants) ? product.variants[0] : undefined; return { ...initialDraft, name: product.name, specification: variant?.specification ?? "", price: String(variant?.price?.amount ?? ""), category: product.category, inventoryStatus: variant?.inventoryStatus ?? "available", tasteTags: Array.isArray(product.tasteTags) ? [...product.tasteTags] : [], fermentation: product.fermentation ?? "", roast: product.roast ?? "", brewing: product.brewing ?? "", summary: product.summary, aroma: product.aroma ?? "", taste: product.taste ?? "", origin: product.teaRegion ?? "" }; }

type ProductManagementErrorBoundaryState = { hasError: boolean };

class ProductManagementErrorBoundary extends Component<{ children: ReactNode }, ProductManagementErrorBoundaryState> {
  state: ProductManagementErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ProductManagementErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <main className="product-draft-page py-8"><section className="product-draft-card" role="alert" aria-labelledby="product-management-error-heading">
        <p className="eyebrow">商品管理</p>
        <h1 id="product-management-error-heading">商品管理暫時無法顯示</h1>
        <p>這個裝置無法完成商品頁面初始化。商品資料未被修改，請重新整理後再試。</p>
        <p className="field-help">診斷代碼：ADMIN_PRODUCTS_RENDER_ERROR</p>
        <div className="form-actions"><button className="primary-action" type="button" onClick={() => window.location.reload()}>重新整理商品管理</button><Link className="filter-button" href="/admin/orders">返回訂單管理</Link></div>
      </section></main>;
    }
    return this.props.children;
  }
}

export function ProductManagementPage(): JSX.Element {
  return <ProductManagementErrorBoundary><ProductManagementContent /></ProductManagementErrorBoundary>;
}

function ProductManagementContent(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loginStatus, setLoginStatus] = useState<DemoMerchantStatus>();
  const [password, setPassword] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthNeeded, setReauthNeeded] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [draft, setDraft] = useState<FormDraft>(initialDraft);
  const [busy, setBusy] = useState<string>();
  const [photoDataUrl, setPhotoDataUrl] = useState<string>();
  const [photoReading, setPhotoReading] = useState(false);
  const [photoFileName, setPhotoFileName] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const refresh = () => { void loadProducts().then(setProducts).catch((caught) => setError(caught instanceof Error ? caught.message : "商品資料無法取得")); };
  useEffect(() => {
    reportAdminProductsReactMounted();
    let alive = true;
    void demoApi.merchantStatus().then(status => {
      if (!alive) return;
      setLoginStatus(status); setAuthenticated(status.authenticated === true); setAuthReady(true);
      if (status.authenticated) refresh();
    }).catch(() => { if (alive) { setError("無法驗證商家 Session。"); setAuthReady(true); } });
    return () => { alive = false; };
  }, []);
  const resumePasskey = async () => {
    const status = await demoApi.merchantStatus();
    if (!status.authenticated) throw new Error("商家 Session 尚未驗證。");
    setLoginStatus(status); setAuthenticated(true); refresh();
  };
  const passwordLogin = async () => {
    try { await demoApi.merchantPasswordLogin(password); setPassword(""); await resumePasskey(); }
    catch (caught) { setPassword(""); setError(caught instanceof Error ? caught.message : "登入失敗"); }
  };
  const reauthenticateAndSave = async (product: Product) => {
    setError("");
    try {
      await demoApi.merchantPasswordLogin(reauthPassword);
      setReauthPassword("");
      setReauthNeeded(false);
      await save(product);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "重新登入失敗。已保留填寫內容與照片。");
    }
  };
  const change = <Key extends keyof FormDraft>(key: Key, value: FormDraft[Key]) => setDraft((current) => ({ ...current, [key]: value }));
  const edit = (product: Product) => { setEditingId(product.id); setDraft(draftFromProduct(product)); setPhotoDataUrl(undefined); setPhotoFileName(""); setPhotoReading(false); setReauthNeeded(false); setReauthPassword(""); setNotice(""); setError(""); };
  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "") { setPhotoDataUrl(undefined); setError("請選擇照片檔案。原照片未更動。"); return; }
    setPhotoReading(true); setPhotoFileName(file.name); setError("");
    void preparePhotoDataUrl(file).then((prepared) => {
      if (prepared.ok) setPhotoDataUrl(prepared.dataUrl);
      else { setPhotoDataUrl(undefined); setPhotoFileName(""); setError(`${prepared.message}原照片未更動。`); }
      setPhotoReading(false);
    });
  };
  const save = async (product: Product) => { const problems = minimumProblems(draft); if (problems.length > 0) { setError(problems.map((problem) => problem.message).join(" ")); return; } setBusy(product.id); setError(""); try { const updated = await patchProduct({ id: product.id, name: draft.name.trim(), category: draft.category, specification: draft.specification.trim(), price: { currency: "TWD", amount: Number(draft.price) }, inventoryStatus: draft.inventoryStatus, aroma: draft.aroma, taste: draft.taste, teaRegion: draft.origin, fermentation: draft.fermentation, roast: draft.roast, brewing: draft.brewing, tasteTags: draft.tasteTags, summary: draft.summary, ...(photoDataUrl ? { imageDataUrl: photoDataUrl } : {}) }); setProducts((current) => current.map((item) => item.id === updated.id ? updated : item)); setEditingId(undefined); setPhotoDataUrl(undefined); setPhotoFileName(""); setNotice(`「${updated.name}」資料${photoDataUrl ? "與照片" : ""}已儲存。`); } catch (caught) { const message = caught instanceof Error ? caught.message : "商品更新失敗"; if (message.includes("Merchant access required")) { setReauthNeeded(true); setError("商家登入已失效。請在下方重新登入，照片與編輯內容都會保留，登入後會自動重試儲存。"); } else setError(message); } finally { setBusy(undefined); } };
  const remove = async (product: Product) => { if (product.publication !== "draft") return; if (!window.confirm(`確定要刪除「${product.name}」？\n商品編號：${product.id}\n刪除後無法復原，後台清單也不會再出現。`)) return; setBusy(product.id); setError(""); setNotice(""); try { await deleteProduct(product.id); setProducts((current) => current.filter((item) => item.id !== product.id)); if (editingId === product.id) setEditingId(undefined); setNotice(`「${product.name}」已刪除。`); } catch (caught) { const message = caught instanceof Error ? caught.message : "商品刪除失敗"; setError(message.includes("Merchant access required") ? "商家登入已失效，請重新整理頁面並登入後再刪除。" : message); } finally { setBusy(undefined); } };
  const toggle = async (product: Product) => { setBusy(product.id); setError(""); try { const updated = await patchProduct({ id: product.id, publication: product.publication === "published" ? "draft" : "published" }); setProducts((current) => current.map((item) => item.id === updated.id ? updated : item)); } catch (caught) { setError(caught instanceof Error ? caught.message : "商品狀態更新失敗"); } finally { setBusy(undefined); } };

  if (!authReady) return <main className="product-draft-page py-8"><section className="product-draft-card"><p role="status">正在驗證商家 Session…</p></section></main>;
  if (!authenticated) return <main className="product-draft-page py-8"><section className="product-draft-card"><h1>商品管理登入</h1>{error && <p role="alert">{error}</p>}
    {loginStatus?.passkey?.enabled && loginStatus.passkey.registered
      ? <AdminPasskeyLogin registered={loginStatus.passkey.registered} onAuthenticated={resumePasskey} />
      : loginStatus?.provider === "password" && loginStatus.state === "ready"
        ? <form onSubmit={event => { event.preventDefault(); void passwordLogin(); }}><label className="form-field">Demo 密碼<input className="form-input" type="password" autoComplete="current-password" maxLength={128} value={password} onChange={event => setPassword(event.target.value)} /></label><button className="primary-action mt-4" disabled={!password}>登入</button></form>
        : <p role="status">目前商家登入方式無法在此裝置使用，請確認 Passkey 或授權管理設定。</p>}
  </section></main>;
  return <main className="product-draft-page py-8 md:py-12"><section className="product-draft-card" aria-labelledby="product-management-heading"><p className="eyebrow">本機 Demo 商品工作台</p><h1 id="product-management-heading">商品管理</h1><p className="prototype-notice">新增與編輯共用同一組欄位與驗證；照片由店家自行準備後上傳，不使用內建影像 AI。</p><nav className="form-actions" aria-label="後台快速導覽"><Link className="primary-action" href="/">前往購物前台</Link><Link className="filter-button" href="/admin/products/new">新增商品</Link><button className="filter-button" type="button" onClick={refresh}>重新整理商品清單</button></nav>{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}<p role="status" aria-live="polite">共 {products.length} 筆商品，其中 {products.filter((product) => product.publication === "draft").length} 筆未上架。新加入的商品顯示在最前面。只有未上架的商品可以刪除。</p><div className="product-admin-list" aria-label="商品清單">{products.map((product) => { const variant = Array.isArray(product.variants) ? product.variants[0] : undefined; const editing = editingId === product.id; return <article className="product-admin-item" key={product.id}><div role="img" aria-label={product.image.alt}>{product.image.src ? <img src={product.image.src} alt={product.image.alt} /> : product.image.alt}</div><div><h2>{product.name}</h2><p>類別：{categoryLabels[product.category]}</p><p>規格：{variant?.specification ?? "未設定"}／NT${variant?.price?.amount?.toLocaleString("zh-TW") ?? "—"}</p><p>庫存狀態：{variant?.inventoryStatus === "available" ? "有貨" : "售完"}</p><p>上架狀態：{product.publication === "published" ? "上架中" : "草稿／未上架（顧客看不到）"}</p><div className="form-actions"><button className="text-button" type="button" onClick={() => editing ? setEditingId(undefined) : edit(product)}>編輯</button><button className="filter-button" type="button" disabled={busy === product.id} onClick={() => void toggle(product)}>{busy === product.id ? "更新中" : product.publication === "published" ? "下架" : "上架"}</button>{product.publication === "draft" && <button className="text-button product-delete-button" type="button" disabled={busy === product.id} onClick={() => void remove(product)}>刪除</button>}</div>{editing && <form className="product-admin-edit" onSubmit={(event) => { event.preventDefault(); if (window.confirm(`確認修改「${product.name}」？\n新價格：NT$${draft.price}\n${photoDataUrl ? "將更換商品照片。" : "保留原照片。"}\n請確認不是其他茶品。`)) void save(product); }}><h3>目前編輯：{product.name}</h3><p role="status">商品編號：{product.id}／原價格：NT${variant?.price?.amount ?? "—"}／新價格：NT${draft.price || "尚未輸入"}</p><ProductFields draft={draft} onChange={change} idPrefix={`edit-${product.id}`} /><div className="form-field"><p><strong>目前已儲存的商品照片</strong>（重新進入編輯仍會顯示）</p>{product.image.src ? <img src={product.image.src} alt={`目前照片：${product.name}`} style={{ maxWidth: 240, width: "100%", height: "auto" }} /> : <p>目前尚未上傳商品照片。</p>}<label htmlFor={`photo-${product.id}`}>選擇新照片以更換（手機照片會自動縮小後上傳）</label><input id={`photo-${product.id}`} type="file" accept="image/*" onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => choosePhoto(event.target.files?.[0])} /><p>選好照片會先預覽，按「儲存編輯」才會正式更換。每次換照片都需再次選取，即使是同名檔案也可以重新選。未選照片則保留原照片。</p>{photoReading && <p role="status">正在讀取照片…</p>}{photoDataUrl && <p role="status">待更換照片：{photoFileName}。請按「儲存編輯」確認。</p>}{photoDataUrl && <div><img src={photoDataUrl} alt="新照片預覽（尚未儲存）" style={{ maxWidth: 240, width: "100%", height: "auto" }} /><button type="button" className="text-button" onClick={() => { setPhotoDataUrl(undefined); setPhotoFileName(""); }}>取消更換照片</button></div>}</div><p className="field-help">原有照片與歷史訂單會保留；本機 Demo 使用同一份 Catalog Store。</p>{reauthNeeded && <section role="group" aria-label="登入過期後重新驗證" className="product-draft-alert"><p>登入已過期。您選好的照片與所有編輯欄位都還在；重新驗證後會繼續儲存，不需要重新選照片。</p><label className="form-field">商家密碼<input className="form-input" type="password" autoComplete="current-password" value={reauthPassword} onChange={event => setReauthPassword(event.target.value)} /></label><button className="primary-action" type="button" disabled={!reauthPassword || busy === product.id} onClick={() => void reauthenticateAndSave(product)}>重新登入並儲存</button></section>}<button className="primary-action" type="submit" disabled={busy === product.id || photoReading || reauthNeeded}>{busy === product.id ? "儲存中" : "儲存編輯"}</button>{error && <p role="alert">儲存未完成：{error}。已填內容仍在，請勿重複新增商品。</p>}</form>}</div></article>; })}</div></section></main>;
}
