import type { Cart, ProductId, VariantId } from "./types";
import type { ServiceResult } from "./result";

export interface CartService {
  getCart(): Promise<ServiceResult<Cart>>;
  addItem(productId: ProductId, variantId: VariantId, quantity: number): Promise<ServiceResult<Cart>>;
  updateQuantity(productId: ProductId, variantId: VariantId, quantity: number): Promise<ServiceResult<Cart>>;
  removeItem(productId: ProductId, variantId: VariantId): Promise<ServiceResult<Cart>>;
}
