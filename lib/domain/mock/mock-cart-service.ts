import { domainError } from "../errors";
import type { CartService } from "../cart-service";
import { createMockCatalogService } from "./mock-catalog-service";
import type { CatalogService } from "../catalog-service";
import type { Cart, CartLine, Product, ProductVariant } from "../types";
import type { ServiceResult } from "../result";
import { isValidQuantity } from "../validation";

export type MockCartScenario = "happy" | "sold-out" | "purchase-limit";

type MockCartOptions = {
  scenario?: MockCartScenario;
  catalog?: CatalogService;
};

const emptyCart = (): Cart => ({
  lines: [],
  subtotal: { currency: "TWD", amount: 0 },
});

const cloneCart = (cart: Cart): Cart => ({
  lines: cart.lines.map((line) => ({ ...line, unitPrice: { ...line.unitPrice } })),
  subtotal: { ...cart.subtotal },
});

const errorResult = <T>(code: "cart-empty" | "product-sold-out" | "purchase-limit-exceeded" | "invalid-draft", message: string): ServiceResult<T> => ({
  ok: false,
  error: domainError(code, message, code === "cart-empty"),
});

const recalculate = (cart: Cart): void => {
  cart.subtotal = {
    currency: "TWD",
    amount: cart.lines.reduce((sum, line) => sum + line.unitPrice.amount * line.quantity, 0),
  };
};

const findVariant = (product: Product, variantId: string): ProductVariant | undefined =>
  product.variants.find((variant) => variant.id === variantId);

export const createMockCartService = (options: MockCartOptions = {}): CartService => {
  const scenario = options.scenario ?? "happy";
  const catalog = options.catalog ?? createMockCatalogService();
  let cart = emptyCart();

  const resolveLine = async (productId: string, variantId: string): Promise<ServiceResult<{ product: Product; variant: ProductVariant }>> => {
    const productResult = await catalog.getProductBySlug(productId);
    if (!productResult.ok) return productResult;
    const variant = findVariant(productResult.value, variantId);
    return variant === undefined
      ? errorResult("invalid-draft", "找不到指定規格。")
      : { ok: true, value: { product: productResult.value, variant } };
  };

  const effectiveStatus = scenario === "sold-out" ? "sold-out" : "available";
  const effectiveLimit = (variant: ProductVariant): number =>
    scenario === "purchase-limit" ? Math.min(2, variant.maxQuantity) : variant.maxQuantity;

  const makeLine = (product: Product, variant: ProductVariant, quantity: number): CartLine => ({
    productId: product.id,
    variantId: variant.id,
    productName: product.name,
    specification: variant.specification,
    unitPrice: { ...variant.price },
    quantity,
    inventoryStatus: effectiveStatus,
    maxQuantity: effectiveLimit(variant),
  });

  return {
    async getCart(): Promise<ServiceResult<Cart>> {
      return { ok: true, value: cloneCart(cart) };
    },

    async addItem(productId, variantId, quantity): Promise<ServiceResult<Cart>> {
      if (!isValidQuantity(quantity)) return errorResult("invalid-draft", "數量必須是正整數。 ");
      const resolved = await resolveLine(productId, variantId);
      if (!resolved.ok) return resolved;
      const { product, variant } = resolved.value;
      if (effectiveStatus === "sold-out") return errorResult("product-sold-out", "這項茶品目前售完。 ");

      const existing = cart.lines.find((line) => line.productId === product.id && line.variantId === variant.id);
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      if (nextQuantity > effectiveLimit(variant)) {
        return errorResult("purchase-limit-exceeded", "已超過這項茶品的購買數量上限。 ");
      }
      if (existing) existing.quantity = nextQuantity;
      else cart.lines.push(makeLine(product, variant, quantity));
      recalculate(cart);
      return { ok: true, value: cloneCart(cart) };
    },

    async updateQuantity(productId, variantId, quantity): Promise<ServiceResult<Cart>> {
      if (!isValidQuantity(quantity)) return errorResult("invalid-draft", "數量必須是正整數。 ");
      const existing = cart.lines.find((line) => line.productId === productId && line.variantId === variantId);
      if (!existing) return errorResult("cart-empty", "購物車中找不到這項茶品。 ");
      if (quantity > existing.maxQuantity) return errorResult("purchase-limit-exceeded", "已超過這項茶品的購買數量上限。 ");
      existing.quantity = quantity;
      recalculate(cart);
      return { ok: true, value: cloneCart(cart) };
    },

    async removeItem(productId, variantId): Promise<ServiceResult<Cart>> {
      const nextLines = cart.lines.filter((line) => !(line.productId === productId && line.variantId === variantId));
      if (nextLines.length === cart.lines.length) return errorResult("cart-empty", "購物車中找不到這項茶品。 ");
      cart.lines = nextLines;
      recalculate(cart);
      return { ok: true, value: cloneCart(cart) };
    },
  };
};
