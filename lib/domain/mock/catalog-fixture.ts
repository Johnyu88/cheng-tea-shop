import type { Product, TeaCategory, TasteTag } from "../types";

const categories: TeaCategory[] = ["white", "green", "oolong", "black", "dark", "other"];
const tastes: TasteTag[] = ["light", "sweet", "rich", "roasted"];

export const mockCatalogFixture: Product[] = Array.from({ length: 48 }, (_, index) => {
  const number = index + 1;
  const category = categories[index % categories.length] ?? "other";
  const firstTaste = tastes[index % tastes.length] ?? "light";
  const secondTaste = tastes[(index + 1) % tastes.length] ?? "sweet";
  const id = `mock-tea-${String(number).padStart(3, "0")}`;

  return {
    id,
    slug: id,
    name: `合成茶品 ${String(number).padStart(3, "0")}`,
    category,
    tasteTags: [firstTaste, secondTaste],
    summary: `${firstTaste}與${secondTaste}的合成示範茶。`,
    image: {
      src: null,
      alt: "商品照片準備中",
      isPlaceholder: true,
    },
    variants: [
      {
        id: `${id}-variant`,
        specification: "一兩",
        price: { currency: "TWD", amount: 500 + number * 10 },
        inventoryStatus: "available",
        maxQuantity: 5,
      },
    ],
    publication: "published",
  };
});
