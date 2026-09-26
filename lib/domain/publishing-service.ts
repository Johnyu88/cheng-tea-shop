import type { Product, ProductDraft } from "./types";
import type { ServiceResult } from "./result";

export interface PublishingService {
  saveDraft(draft: ProductDraft): Promise<ServiceResult<ProductDraft>>;
  publishDraft(
    draft: ProductDraft,
    confirmation: { confirmed: boolean },
  ): Promise<ServiceResult<Product>>;
}
