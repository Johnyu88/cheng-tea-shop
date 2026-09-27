"use client";

/* Local object-URL previews are intentionally not eligible for next/image optimization. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ChangeEvent, type JSX } from "react";
import Link from "next/link";
import type { DomainError, Product, ProductDraft, ProductDraftPhoto } from "@/lib/domain";
import { useCommerce } from "@/features/commerce/components/commerce-provider";
import { initialDraft, minimumProblems, ProductFields, toProductDraft, type FieldProblem, type FormDraft } from "./product-form";

type Operation = "idle" | "saving" | "publishing";
const inProgressStatus: Record<Exclude<Operation, "idle">, string> = { saving: "正在儲存商品。", publishing: "正在上架商品。" };

export function ProductDraftPage(): JSX.Element {
  const { publishingService } = useCommerce();
  const [draft, setDraft] = useState<FormDraft>(initialDraft);
  const [photos, setPhotos] = useState<ProductDraftPhoto[]>([]);
  const [fieldProblems, setFieldProblems] = useState<FieldProblem[]>([]);
  const [error, setError] = useState<DomainError>();
  const [status, setStatus] = useState("");
  const [operation, setOperation] = useState<Operation>("idle");
  const [confirmed, setConfirmed] = useState(false);
  const [publishedProduct, setPublishedProduct] = useState<Product>();
  const [savedDraftName, setSavedDraftName] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const activeOperation = useRef<Operation>("idle");
  const photosRef = useRef<ProductDraftPhoto[]>([]);
  const nextPhotoId = useRef(1);

  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => {
    const timer = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => () => { photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)); }, []);

  const change = <Key extends keyof FormDraft>(key: Key, value: FormDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setConfirmed(false);
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
    setStatus(inProgressStatus[nextOperation]);
    return true;
  };
  const finish = () => { activeOperation.current = "idle"; setOperation("idle"); };
  const saveDraft = async () => {
    const submission = validate();
    if (!submission || !start("saving")) return;
    const result = await publishingService.saveDraft(submission);
    if (result.ok) { setStatus("商品草稿已儲存，尚未上架。"); setSavedDraftName(submission.name); } else { setError(result.error); setStatus(result.error.message); }
    finish();
  };
  const publishDraft = async () => {
    const submission = validate();
    if (!submission || !confirmed || !start("publishing")) return;
    const result = await publishingService.publishDraft(submission, { confirmed: true });
    if (result.ok) { setPublishedProduct(result.value); setStatus("商品已上架。照片與欄位均由店家確認後儲存。"); } else { setError(result.error); setStatus(result.error.message); }
    finish();
  };
  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    if (files.some((file) => !file.type.startsWith("image/"))) { setError({ code: "invalid-draft", message: "請選擇圖片檔案。", retryable: false }); return; }
    if (photos.length + files.length > 3) { setError({ code: "invalid-draft", message: "商品照片最多三張；原本選擇的照片與文字都已保留。", retryable: false }); return; }
    const additions = files.map((file) => ({ id: `local-photo-${nextPhotoId.current++}`, previewUrl: URL.createObjectURL(file), fileName: file.name, alt: `${file.name} 預覽` }));
    setPhotos((current) => [...current, ...additions]);
    void Promise.all(files.map((file) => new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    }))).then((dataUrls) => {
      setPhotos((current) => current.map((photo) => {
        const additionIndex = additions.findIndex((addition) => addition.id === photo.id);
        const dataUrl = additionIndex >= 0 ? dataUrls[additionIndex] : undefined;
        return dataUrl ? { ...photo, dataUrl } : photo;
      }));
    });
    setConfirmed(false);
    setError(undefined);
  };
  const removePhoto = (id: string) => {
    const removed = photos.find((photo) => photo.id === id);
    if (!removed) return;
    URL.revokeObjectURL(removed.previewUrl);
    setPhotos((current) => current.filter((photo) => photo.id !== id));
    setConfirmed(false);
  };
  const canPublish = minimumProblems(draft).length === 0 && confirmed && operation !== "publishing";
  if (publishedProduct) return <PublishedSuccess product={publishedProduct} />;
  if (savedDraftName) return <SavedDraftSuccess name={savedDraftName} />;

  return <main className="product-draft-page py-8 md:py-12" data-hydrated={hydrated ? "true" : "false"}>
    <p role="status" aria-live="polite" className="product-draft-status">{status}</p>
    <section aria-labelledby="product-draft-heading" className="product-draft-card">
      <p className="eyebrow">商品管理</p><h1 id="product-draft-heading">新增商品</h1>
      <p className="prototype-notice">這是本機 Demo：沒有真實管理員驗證，不會連接正式 ERP 或外部影像服務。</p><p>上架資料會寫入本機 `.demo-data`，供同一台 Demo server 重啟後重新讀取；照片由店家確認後保留。</p>
      {fieldProblems.length > 0 && <ValidationSummary problems={fieldProblems} />}{error && <div role="alert" className="product-draft-alert">{error.message}</div>}
      <div className="product-draft-layout"><section aria-label="商品資料欄位"><h2>商品資料</h2><ProductFields draft={draft} onChange={change} />
      <PhotoPicker photos={photos} onAdd={addPhotos} onRemove={removePhoto} />
      </section><aside className="product-draft-actions" aria-label="商品操作"><h2>儲存與上架</h2><p>新增與編輯使用相同欄位。請確認內容後再上架。</p><div className="form-actions"><button className="primary-action" type="button" disabled={operation !== "idle"} onClick={() => void saveDraft()}>{operation === "saving" ? "儲存中" : "儲存商品"}</button><Link className="text-button" href="/admin/products" aria-disabled={operation !== "idle"} onClick={(event) => { if (operation !== "idle") event.preventDefault(); }}>取消新增／返回商品管理</Link></div><label className="product-draft-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />我已確認照片與商品資料</label><button className="primary-action product-draft-publish" type="button" disabled={!canPublish} onClick={() => void publishDraft()}>{operation === "publishing" ? "上架處理中" : "確認並上架"}</button></aside></div>
    </section>
  </main>;
}

function SavedDraftSuccess({ name }: { name: string }): JSX.Element { return <main className="product-draft-page py-8 md:py-12"><section className="product-draft-card" aria-labelledby="draft-saved-heading"><p role="status" aria-live="polite">商品草稿已儲存，尚未上架。</p><h1 id="draft-saved-heading">儲存成功</h1><p>「{name}」已保存到商品管理，顧客目前看不到這項草稿。</p><div className="form-actions"><Link className="primary-action" href="/admin/products">返回商品管理</Link><Link className="text-button" href="/admin/products/new">繼續新增商品</Link></div></section></main>; }

function ValidationSummary({ problems }: { problems: FieldProblem[] }): JSX.Element { return <div role="alert" className="product-draft-alert"><strong>請先完成必填欄位：</strong><ul>{problems.map((problem) => <li key={problem.field}>{problem.label}：{problem.message}</li>)}</ul></div>; }
function PhotoPicker({ photos, onAdd, onRemove }: { photos: ProductDraftPhoto[]; onAdd: (event: ChangeEvent<HTMLInputElement>) => void; onRemove: (id: string) => void }): JSX.Element { return <section className="product-draft-photos" aria-labelledby="product-photo-heading"><h2 id="product-photo-heading">商品照片（選填）</h2><p>照片由店家自行拍攝或於外部工具處理後上傳；網站只保存已確認的照片。</p><label className="form-field" htmlFor="product-photos">選擇商品照片（最多三張）<input id="product-photos" className="form-input" type="file" accept="image/*" multiple onChange={onAdd} /></label><p>已選擇 {photos.length}／3 張照片</p>{photos.length > 0 && <ul className="product-draft-photo-list">{photos.map((photo) => <li key={photo.id}><img src={photo.previewUrl} alt={photo.alt} /><button className="text-button" type="button" onClick={() => onRemove(photo.id)}>移除 {photo.alt.replace(" 預覽", "")}</button></li>)}</ul>}</section>; }
function PublishedSuccess({ product }: { product: Product }): JSX.Element { const variant = product.variants[0]; return <main className="product-draft-page py-8 md:py-12"><section className="product-draft-card" aria-labelledby="product-published-heading"><p role="status" aria-live="polite">商品資料已儲存。</p><h1 id="product-published-heading">商品已上架</h1><p>商品編號：{product.id}</p><p>已上架商品：{product.name}</p>{variant && <p>規格：{variant.specification}／NT${variant.price.amount}</p>}<p>資料會保存在目前 Demo server 的 `.demo-data`，不會連接正式 ERP。</p></section></main>; }
