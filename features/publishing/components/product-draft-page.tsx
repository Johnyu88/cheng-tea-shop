"use client";

/* Local object-URL previews are intentionally not eligible for next/image optimization. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ChangeEvent, type JSX } from "react";
import type { DomainError, InventoryStatus, Product, ProductDraft, ProductDraftPhoto, TasteTag, TeaCategory } from "@/lib/domain";
import { useCommerce } from "@/features/commerce/components/commerce-provider";

type Operation = "idle" | "saving" | "generating" | "publishing";
type PreviewMode = "mobile" | "desktop";
type FieldKey = "name" | "specification" | "price" | "category";
type FormDraft = { name: string; specification: string; price: string; category: TeaCategory | ""; inventoryStatus: InventoryStatus; tasteTags: TasteTag[]; summary: string; origin: string; fermentation: string; roast: string; aroma: string; brewing: string };
type FieldProblem = { field: FieldKey; label: string; message: string };

const initialDraft: FormDraft = { name: "", specification: "", price: "", category: "", inventoryStatus: "available", tasteTags: [], summary: "", origin: "", fermentation: "", roast: "", aroma: "", brewing: "" };
const categories: Array<[TeaCategory, string]> = [["white", "白茶"], ["green", "綠茶"], ["oolong", "烏龍茶"], ["black", "紅茶"], ["dark", "黑茶"], ["other", "其他茶類"]];
const tasteTags: Array<[TasteTag, string]> = [["light", "清香"], ["sweet", "甘甜"], ["rich", "濃郁"], ["roasted", "焙火"]];

function minimumProblems(draft: FormDraft): FieldProblem[] {
  const problems: FieldProblem[] = [];
  if (!draft.name.trim()) problems.push({ field: "name", label: "茶名", message: "請填寫茶名。" });
  if (!draft.specification.trim()) problems.push({ field: "specification", label: "單一規格", message: "請填寫單一規格。" });
  if (!/^\d+$/.test(draft.price)) problems.push({ field: "price", label: "價格（TWD）", message: "請輸入整數 TWD 價格。" });
  if (!draft.category) problems.push({ field: "category", label: "茶類", message: "請選擇茶類。" });
  return problems;
}

function fieldId(field: FieldKey): string {
  return field === "name" ? "product-name" : field === "specification" ? "product-specification" : field === "price" ? "product-price" : "product-category";
}

function toProductDraft(draft: FormDraft, photos: ProductDraftPhoto[]): ProductDraft {
  return {
    name: draft.name.trim(), specification: draft.specification.trim(), price: { currency: "TWD", amount: Number(draft.price) }, category: draft.category as TeaCategory, inventoryStatus: draft.inventoryStatus, tasteTags: [...draft.tasteTags],
    ...(draft.summary.trim() ? { summary: draft.summary.trim() } : {}),
    ...(photos.length > 0 ? { photos: photos.map((photo) => ({ ...photo })) } : {}),
    ...(draft.origin.trim() ? { origin: draft.origin.trim() } : {}),
    ...(draft.fermentation.trim() ? { fermentation: draft.fermentation.trim() } : {}),
    ...(draft.roast.trim() ? { roast: draft.roast.trim() } : {}),
    ...(draft.aroma.trim() ? { aroma: draft.aroma.trim() } : {}),
    ...(draft.brewing.trim() ? { brewing: draft.brewing.trim() } : {}),
  };
}

export function ProductDraftPage(): JSX.Element {
  const { publishingService } = useCommerce();
  const [draft, setDraft] = useState<FormDraft>(initialDraft);
  const [photos, setPhotos] = useState<ProductDraftPhoto[]>([]);
  const [fieldProblems, setFieldProblems] = useState<FieldProblem[]>([]);
  const [error, setError] = useState<DomainError>();
  const [status, setStatus] = useState("");
  const [operation, setOperation] = useState<Operation>("idle");
  const [previewMode, setPreviewMode] = useState<PreviewMode | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [publishedProduct, setPublishedProduct] = useState<Product>();
  const activeOperation = useRef<Operation>("idle");
  const photosRef = useRef<ProductDraftPhoto[]>([]);
  const nextPhotoId = useRef(1);

  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => () => { photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)); }, []);

  const change = <Key extends keyof FormDraft>(key: Key, value: FormDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldProblems([]);
    setError(undefined);
  };
  const validate = (): ProductDraft | undefined => {
    const problems = minimumProblems(draft);
    if (problems.length > 0) { setFieldProblems(problems); setError(undefined); setStatus(""); return undefined; }
    setFieldProblems([]);
    return toProductDraft(draft, photos);
  };
  const start = (nextOperation: Exclude<Operation, "idle">): boolean => {
    if (activeOperation.current !== "idle") return false;
    activeOperation.current = nextOperation;
    setOperation(nextOperation);
    setError(undefined);
    setStatus("");
    return true;
  };
  const finish = () => { activeOperation.current = "idle"; setOperation("idle"); };
  const saveDraft = async () => {
    const submission = validate();
    if (!submission || !start("saving")) return;
    const result = await publishingService.saveDraft(submission);
    if (result.ok) setStatus("草稿已儲存；這仍是暫存商品，尚未上架。"); else setError(result.error);
    finish();
  };
  const generateSummary = async () => {
    const submission = validate();
    if (!submission || !start("generating")) return;
    const result = await publishingService.generateSummary(submission);
    if (result.ok) { setDraft((current) => ({ ...current, summary: result.value })); setStatus("已產生可編輯的介紹草稿；請由您確認後再上架。"); } else setError(result.error);
    finish();
  };
  const publishDraft = async () => {
    const submission = validate();
    if (!submission || !confirmed || !start("publishing")) return;
    const result = await publishingService.publishDraft(submission, { confirmed: true });
    if (result.ok) { setPublishedProduct(result.value); setStatus("商品已上架為合成展示資料。沒有儲存到正式系統。"); } else setError(result.error);
    finish();
  };
  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    if (files.some((file) => !file.type.startsWith("image/"))) { setError({ code: "invalid-draft", message: "請選擇圖片檔案。", retryable: false }); return; }
    if (photos.length + files.length > 3) { setError({ code: "invalid-draft", message: "商品照片最多三張；原本選擇的照片與文字都已保留。", retryable: false }); return; }
    const additions = files.map((file) => ({ id: `local-photo-${nextPhotoId.current++}`, previewUrl: URL.createObjectURL(file), alt: `${file.name} 預覽` }));
    setPhotos((current) => [...current, ...additions]);
    setError(undefined);
  };
  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  };
  const canPublish = minimumProblems(draft).length === 0 && confirmed && operation !== "publishing";
  if (publishedProduct) return <PublishedSuccess product={publishedProduct} />;

  return <main className="product-draft-page py-8 md:py-12">
    <p role="status" aria-live="polite" className="product-draft-status">{status}</p>
    <section aria-labelledby="product-draft-heading" className="product-draft-card">
      <p className="eyebrow">商品上架原型</p><h1 id="product-draft-heading">新增一項茶品</h1>
      <p className="prototype-notice">這是原型頁面：尚未實作真實管理員驗證。</p><p>資料只保留在目前畫面；不會上傳照片、儲存草稿或連接 ERP。</p>
      {fieldProblems.length > 0 && <ValidationSummary problems={fieldProblems} />}{error && <div role="alert" className="product-draft-alert">{error.message}</div>}
      <div className="product-draft-layout"><section aria-label="商品草稿欄位"><h2>先填這五項</h2><div className="product-draft-fields">
        <label className="form-field" htmlFor="product-name">茶名<input id="product-name" className="form-input" value={draft.name} onChange={(event) => change("name", event.target.value)} /></label>
        <label className="form-field" htmlFor="product-specification">單一規格<input id="product-specification" className="form-input" value={draft.specification} onChange={(event) => change("specification", event.target.value)} placeholder="例如：150g" /></label>
        <label className="form-field" htmlFor="product-price">價格（TWD）<input id="product-price" className="form-input" value={draft.price} onChange={(event) => change("price", event.target.value)} inputMode="numeric" aria-describedby="product-price-help" /></label><p id="product-price-help" className="field-help">請輸入整數價格，例如 1200。</p>
        <label className="form-field" htmlFor="product-category">茶類<select id="product-category" className="form-select" value={draft.category} onChange={(event) => change("category", event.target.value as TeaCategory | "")}><option value="">請選擇茶類</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <fieldset className="form-fieldset"><legend>供貨狀態</legend><label className="form-option"><input type="radio" name="inventory" checked={draft.inventoryStatus === "available"} onChange={() => change("inventoryStatus", "available")} />有貨</label><label className="form-option"><input type="radio" name="inventory" checked={draft.inventoryStatus === "sold-out"} onChange={() => change("inventoryStatus", "sold-out")} />售完</label></fieldset>
      </div>
      <PhotoPicker photos={photos} onAdd={addPhotos} onRemove={removePhoto} />
      <details className="product-draft-details"><summary>補充茶品事實（選填）</summary><div className="product-draft-fields mt-4"><fieldset className="form-fieldset"><legend>口感標籤（選填）</legend>{tasteTags.map(([value, label]) => <label className="form-option" key={value}><input type="checkbox" checked={draft.tasteTags.includes(value)} onChange={() => change("tasteTags", draft.tasteTags.includes(value) ? draft.tasteTags.filter((tag) => tag !== value) : [...draft.tasteTags, value])} />{label}</label>)}</fieldset><FactField label="產地（選填）" value={draft.origin} onChange={(value) => change("origin", value)} /><FactField label="發酵（選填）" value={draft.fermentation} onChange={(value) => change("fermentation", value)} /><FactField label="焙火（選填）" value={draft.roast} onChange={(value) => change("roast", value)} /><FactField label="香氣（選填）" value={draft.aroma} onChange={(value) => change("aroma", value)} /><FactField label="沖泡方式（選填）" value={draft.brewing} onChange={(value) => change("brewing", value)} /></div></details>
      <label className="form-field mt-6" htmlFor="product-summary">商品介紹草稿（可編輯）<textarea id="product-summary" className="form-textarea" value={draft.summary} onChange={(event) => change("summary", event.target.value)} /></label>
      </section><aside className="product-draft-actions" aria-label="草稿操作"><h2>下一步</h2><p>介紹草稿只會使用您在此頁填寫的事實。請自行確認內容。</p><div className="form-actions"><button className="primary-action" type="button" disabled={operation === "saving"} onClick={() => void saveDraft()}>{operation === "saving" ? "儲存中" : "儲存草稿"}</button><button className="filter-button" type="button" disabled={operation === "generating"} onClick={() => void generateSummary()}>{operation === "generating" ? "產生中" : "產生介紹草稿"}</button><button className="filter-button" type="button" onClick={() => setPreviewMode("mobile")}>預覽手機版</button><button className="filter-button" type="button" onClick={() => setPreviewMode("desktop")}>預覽電腦版</button></div><label className="product-draft-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />我已確認內容，將上架這項商品</label><button className="primary-action product-draft-publish" type="button" disabled={!canPublish} onClick={() => void publishDraft()}>{operation === "publishing" ? "上架處理中" : "確認並上架"}</button></aside></div>
      {previewMode && <ProductPreview draft={draft} mode={previewMode} />}
    </section>
  </main>;
}

function ValidationSummary({ problems }: { problems: FieldProblem[] }): JSX.Element { return <div role="alert" className="product-draft-alert"><strong>請先完成必填欄位：</strong><ul>{problems.map((problem) => <li key={problem.field}><a href={`#${fieldId(problem.field)}`}>{problem.label}</a>：{problem.message}</li>)}</ul></div>; }
function FactField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }): JSX.Element { return <label className="form-field">{label}<input className="form-input" value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function PhotoPicker({ photos, onAdd, onRemove }: { photos: ProductDraftPhoto[]; onAdd: (event: ChangeEvent<HTMLInputElement>) => void; onRemove: (id: string) => void }): JSX.Element { return <section className="product-draft-photos" aria-labelledby="product-photo-heading"><h2 id="product-photo-heading">商品照片（選填）</h2><p>可選 0 至 3 張，只在此頁顯示本機預覽，不會上傳。</p><label className="form-field" htmlFor="product-photos">選擇商品照片（最多三張）<input id="product-photos" className="form-input" type="file" accept="image/*" multiple onChange={onAdd} /></label><p>已選擇 {photos.length}／3 張照片</p>{photos.length > 0 && <ul className="product-draft-photo-list">{photos.map((photo) => <li key={photo.id}><img src={photo.previewUrl} alt={photo.alt} /><button className="text-button" type="button" onClick={() => onRemove(photo.id)}>移除 {photo.alt.replace(" 預覽", "")}</button></li>)}</ul>}</section>; }
function ProductPreview({ draft, mode }: { draft: FormDraft; mode: PreviewMode }): JSX.Element { return <section className={`product-draft-preview product-draft-preview-${mode}`} aria-label="商品預覽" data-preview-mode={mode}><p className="eyebrow">{mode === "mobile" ? "手機版預覽" : "電腦版預覽"}</p><h2>{draft.name || "尚未命名的茶品"}</h2><p>{draft.specification || "尚未填寫規格"}・{draft.price ? `NT$${draft.price}` : "尚未填寫價格"}</p><p>{draft.summary || "尚未提供商品介紹。"}</p></section>; }
function PublishedSuccess({ product }: { product: Product }): JSX.Element { return <main className="product-draft-page py-8 md:py-12"><section className="product-draft-card" aria-labelledby="product-published-heading"><p role="status" aria-live="polite">商品已上架為合成展示資料。</p><h1 id="product-published-heading">商品已上架</h1><p>合成商品編號：{product.id}</p><p>已建立 {product.variants.length} 個規格</p><p>這是原型結果，沒有真實管理員驗證、資料持久化或照片上傳。</p></section></main>; }
