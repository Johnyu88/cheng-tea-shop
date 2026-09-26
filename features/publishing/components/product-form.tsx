import type { JSX } from "react";
import type { InventoryStatus, ProductDraftPhoto, TeaCategory, TasteTag } from "@/lib/domain";

export type FormDraft = {
  name: string;
  specification: string;
  price: string;
  category: TeaCategory | "";
  inventoryStatus: InventoryStatus;
  tasteTags: TasteTag[];
  summary: string;
  origin: string;
  fermentation: string;
  roast: string;
  aroma: string;
  taste: string;
  brewing: string;
};

export type FieldKey = "name" | "specification" | "price" | "category";
export type FieldProblem = { field: FieldKey; label: string; message: string };

export const initialDraft: FormDraft = { name: "", specification: "", price: "", category: "", inventoryStatus: "available", tasteTags: [], summary: "", origin: "", fermentation: "", roast: "", aroma: "", taste: "", brewing: "" };
export const categories: Array<[TeaCategory, string]> = [["wild-mountain", "台灣野生山茶"], ["white", "白茶"], ["green", "綠茶"], ["yellow", "黃茶"], ["oolong", "青茶／烏龍茶"], ["black", "紅茶"], ["flower", "花茶"], ["dark", "黑茶"], ["special", "特殊茶"], ["aged", "老茶"], ["other", "其他茶類"]];
const tasteTags: Array<[TasteTag, string]> = [["light", "清香"], ["sweet", "甘甜"], ["rich", "濃郁"], ["roasted", "焙火"]];

export function minimumProblems(draft: FormDraft): FieldProblem[] {
  const problems: FieldProblem[] = [];
  if (!draft.name.trim()) problems.push({ field: "name", label: "茶名", message: "請填寫茶名。" });
  if (!draft.specification.trim()) problems.push({ field: "specification", label: "單一規格", message: "請填寫單一規格。" });
  if (!/^\d+$/.test(draft.price)) problems.push({ field: "price", label: "價格（TWD）", message: "請輸入整數 TWD 價格。" });
  if (!draft.category) problems.push({ field: "category", label: "茶類", message: "請選擇茶類。" });
  return problems;
}

export function toProductDraft(draft: FormDraft, photos: ProductDraftPhoto[] = []) {
  return {
    name: draft.name.trim(), specification: draft.specification.trim(), price: { currency: "TWD" as const, amount: Number(draft.price) }, category: draft.category as TeaCategory, inventoryStatus: draft.inventoryStatus, tasteTags: [...draft.tasteTags],
    ...(draft.summary.trim() ? { summary: draft.summary.trim() } : {}), ...(photos.length > 0 ? { photos: photos.map((photo) => ({ ...photo })) } : {}),
    ...(draft.origin.trim() ? { origin: draft.origin.trim() } : {}), ...(draft.fermentation.trim() ? { fermentation: draft.fermentation.trim() } : {}), ...(draft.roast.trim() ? { roast: draft.roast.trim() } : {}), ...(draft.aroma.trim() ? { aroma: draft.aroma.trim() } : {}), ...(draft.taste.trim() ? { taste: draft.taste.trim() } : {}), ...(draft.brewing.trim() ? { brewing: draft.brewing.trim() } : {}),
  };
}

export function ProductFields({ draft, onChange, idPrefix = "product" }: { draft: FormDraft; onChange: <Key extends keyof FormDraft>(key: Key, value: FormDraft[Key]) => void; idPrefix?: string }): JSX.Element {
  const id = (field: string) => `${idPrefix}-${field}`;
  return <div className="product-draft-fields">
    <label className="form-field" htmlFor={id("name")}>茶名<input id={id("name")} className="form-input" value={draft.name} onChange={(event) => onChange("name", event.target.value)} required /></label>
    <label className="form-field" htmlFor={id("specification")}>規格<input id={id("specification")} className="form-input" value={draft.specification} onChange={(event) => onChange("specification", event.target.value)} placeholder="例如：150g" required /></label>
    <label className="form-field" htmlFor={id("price")}>價格（TWD）<input id={id("price")} className="form-input" value={draft.price} onChange={(event) => onChange("price", event.target.value)} inputMode="numeric" required /></label>
    <label className="form-field" htmlFor={id("category")}>茶類<select id={id("category")} className="form-select" value={draft.category} onChange={(event) => onChange("category", event.target.value as TeaCategory | "")} required><option value="">請選擇茶類</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="form-field" htmlFor={id("inventory")}>庫存<select id={id("inventory")} className="form-select" value={draft.inventoryStatus} onChange={(event) => onChange("inventoryStatus", event.target.value as InventoryStatus)}><option value="available">有貨</option><option value="sold-out">售完</option></select></label>
    <FactField label="香氣" value={draft.aroma} onChange={(value) => onChange("aroma", value)} />
    <FactField label="口感" value={draft.taste} onChange={(value) => onChange("taste", value)} />
    <FactField label="產地" value={draft.origin} onChange={(value) => onChange("origin", value)} />
    <label className="form-field" htmlFor={id("summary")}>商品介紹<textarea id={id("summary")} className="form-textarea" value={draft.summary} onChange={(event) => onChange("summary", event.target.value)} /></label>
    <details className="product-draft-details"><summary>其他茶品事實（選填）</summary><div className="product-draft-fields mt-4"><fieldset className="form-fieldset"><legend>口感標籤（選填）</legend>{tasteTags.map(([value, label]) => <label className="form-option" key={value}><input type="checkbox" checked={draft.tasteTags.includes(value)} onChange={() => onChange("tasteTags", draft.tasteTags.includes(value) ? draft.tasteTags.filter((tag) => tag !== value) : [...draft.tasteTags, value])} />{label}</label>)}</fieldset><FactField label="發酵（選填）" value={draft.fermentation} onChange={(value) => onChange("fermentation", value)} /><FactField label="焙火（選填）" value={draft.roast} onChange={(value) => onChange("roast", value)} /><FactField label="沖泡方式（選填）" value={draft.brewing} onChange={(value) => onChange("brewing", value)} /></div></details>
  </div>;
}

function FactField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }): JSX.Element { return <label className="form-field">{label}<input className="form-input" value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
