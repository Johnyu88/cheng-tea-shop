import type { Product, ProductDraft, ProductId } from "./types";
import type { ServiceResult } from "./result";

export type SavedProductDraft = ProductDraft & { id?: ProductId };

export interface PublishingService {
  saveDraft(draft: ProductDraft): Promise<ServiceResult<SavedProductDraft>>;
  publishDraft(
    draft: ProductDraft,
    confirmation: { confirmed: boolean },
  ): Promise<ServiceResult<Product>>;
}
