import teaSamples from "@/data/tea-samples-2026-09-23.json";
import type { Product, TeaCategory, TasteTag } from "../types";
type ProductVisualStyle = "linen" | "moss" | "amber" | "rose" | "mist" | "wood" | "clay" | "cream";

const photoPaths: Record<string, string> = {
  "IMG_9600(1).jpeg": "/media/tea-products/taiwan-mi-xiang-wild-mountain-tea.png",
  "IMG_9602(1).jpeg": "/media/tea-products/taiwan-fo-shou-tea.png",
  "IMG_9604(1).jpeg": "/media/tea-products/oolong-green-tea.png",
  "IMG_9605(1).jpeg": "/media/tea-products/wuyi-rose-black-tea.png",
  "IMG_9606(1).jpeg": "/media/tea-products/wushi-jinxuan-yellow-tea.png",
  "IMG_9607(1).jpeg": "/media/tea-products/bai-mao-hou.png",
  "IMG_9608(1).jpeg": "/media/tea-products/daye-oolong-honey-black-tea.png",
  "IMG_9609(1).jpeg": "/media/tea-products/herbal-aroma-aged-oolong.png",
};

const metadata: Array<{ category: TeaCategory; tastes: TasteTag[]; slug: string; visualStyle: ProductVisualStyle }> = [
  { category: "wild-mountain", tastes: ["sweet"], slug: "taiwan-mi-xiang-wild-mountain-tea", visualStyle: "linen" },
  { category: "oolong", tastes: ["light"], slug: "taiwan-fo-shou-tea", visualStyle: "moss" },
  { category: "green", tastes: ["light", "sweet"], slug: "oolong-green-tea", visualStyle: "amber" },
  { category: "flower", tastes: ["sweet", "rich"], slug: "wuyi-rose-black-tea", visualStyle: "rose" },
  { category: "yellow", tastes: ["sweet", "rich"], slug: "wushi-jinxuan-yellow-tea", visualStyle: "mist" },
  { category: "white", tastes: ["sweet", "rich"], slug: "bai-mao-hou", visualStyle: "wood" },
  { category: "black", tastes: ["sweet"], slug: "daye-oolong-honey-black-tea", visualStyle: "clay" },
  { category: "aged", tastes: ["sweet"], slug: "herbal-aroma-aged-oolong", visualStyle: "cream" },
];

export const confirmedTeaFixture: Product[] = teaSamples.samples.map((sample, index) => {
  const meta = metadata[index]!;
  const id = `cheng-tea-${sample.id.replace("tea-sample-2026-09-23-", "")}`;
  const packageWeight = sample.packageSize.replace(/兩$/, "");
  const imagePath = photoPaths[sample.photoFiles[0] ?? ""] ?? null;
  return {
    id,
    slug: meta.slug,
    name: sample.name,
    category: meta.category,
    tasteTags: meta.tastes,
    summary: `${sample.aroma}，${sample.taste}。`,
    image: { src: imagePath, alt: `${sample.name}茶樣照片`, isPlaceholder: imagePath === null },
    variants: [{ id: `${id}-variant`, specification: sample.packageSize, price: { currency: "TWD", amount: sample.price.amount }, inventoryStatus: "available", maxQuantity: 5 }],
    publication: "published",
    inventoryQuantity: sample.inventory.quantity,
    inventoryUnit: "包",
    packageWeight,
    teaRegion: sample.teaRegion ?? undefined,
    aroma: sample.aroma ?? undefined,
    taste: sample.taste ?? undefined,
  };
});
