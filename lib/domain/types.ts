export type ProductId = string;
export type ProductSlug = string;
export type VariantId = string;

export type Money = {
  currency: "TWD";
  amount: number;
};

export type InventoryStatus = "available" | "sold-out";
export type TeaCategory = "white" | "green" | "oolong" | "black" | "dark" | "other";
export type TasteTag = "light" | "sweet" | "rich" | "roasted";

export type ProductImage = {
  src: string | null;
  alt: string;
  isPlaceholder: boolean;
};

export type ProductVariant = {
  id: VariantId;
  specification: string;
  price: Money;
  inventoryStatus: InventoryStatus;
  maxQuantity: number;
};

export type Product = {
  id: ProductId;
  slug: ProductSlug;
  name: string;
  category: TeaCategory;
  tasteTags: TasteTag[];
  summary: string;
  image: ProductImage;
  variants: ProductVariant[];
  publication: "draft" | "published";
};

export type ProductDraft = {
  name: string;
  specification: string;
  price: Money;
  category: TeaCategory;
  inventoryStatus: InventoryStatus;
  tasteTags: TasteTag[];
  summary?: string;
  photos?: ProductDraftPhoto[];
  origin?: string;
  fermentation?: string;
  roast?: string;
  aroma?: string;
  brewing?: string;
};

export type ProductDraftPhoto = {
  id: string;
  previewUrl: string;
  alt: string;
};

export type CartLine = {
  productId: ProductId;
  variantId: VariantId;
  productName: string;
  specification: string;
  unitPrice: Money;
  quantity: number;
  inventoryStatus: InventoryStatus;
  maxQuantity: number;
};

export type Cart = {
  lines: CartLine[];
  subtotal: Money;
};

export type CheckoutDraft = {
  name: string;
  phone: string;
  email?: string;
  deliveryMethod: "home-delivery" | "store-pickup";
  address?: string;
  paymentMethod: "credit-card" | "line-pay" | "pay-at-store";
};

export type CheckoutReceipt = {
  orderReference: string;
  status: "confirmed";
  total: Money;
};

export type CatalogQuery = {
  category?: TeaCategory;
  taste?: TasteTag;
  cursor?: string;
  limit?: number;
};

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
  total: number;
};
