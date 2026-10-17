import type { JSX } from "react";
import type { Product, TasteTag } from "@/lib/domain";

const tasteTagLabels: Record<TasteTag, string> = { light: "清香", sweet: "甘甜", rich: "濃郁", roasted: "焙火" };

export const tasteTagText = (tags: readonly TasteTag[]): string => tags.map((tag) => tasteTagLabels[tag] ?? tag).join("・");

const factFields: Array<[keyof Pick<Product, "teaRegion" | "aroma" | "taste" | "fermentation" | "roast" | "brewing">, string]> = [
  ["teaRegion", "產地"], ["aroma", "香氣"], ["taste", "口感"], ["fermentation", "發酵"], ["roast", "焙火"], ["brewing", "沖泡方式"],
];

/** Merchant-entered tea facts; fields left blank in the back office are omitted. */
export function TeaFacts({ product, className }: { product: Product; className?: string }): JSX.Element | null {
  const facts = factFields.flatMap(([key, label]) => { const value = product[key]?.trim(); return value ? [[label, value] as const] : []; });
  if (facts.length === 0) return null;
  return <dl className={className ?? "tea-facts"}>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
