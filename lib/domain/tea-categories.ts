import type { TeaCategory } from "./types";

export const storefrontTeaCategories: ReadonlyArray<{ value: TeaCategory; label: string }> = [
  { value: "wild-mountain", label: "台灣野生山茶" },
  { value: "green", label: "綠茶" },
  { value: "white", label: "白茶" },
  { value: "yellow", label: "黃茶" },
  { value: "oolong", label: "青茶" },
  { value: "black", label: "紅茶" },
  { value: "dark", label: "黑茶" },
  { value: "flower", label: "花茶" },
  { value: "special", label: "特殊茶" },
  { value: "aged", label: "老茶" },
];

export const storefrontCategoryOptions: ReadonlyArray<{ value: TeaCategory | undefined; label: string }> = [
  { value: undefined, label: "全部" },
  ...storefrontTeaCategories,
];
