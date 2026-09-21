import type { Product, ProductDraft } from "./types";
import type { ServiceResult } from "./result";

export interface PublishingService {
  generateSummary(draft: ProductDraft): Promise<ServiceResult<string>>;
  saveDraft(draft: ProductDraft): Promise<ServiceResult<ProductDraft>>;
  publishDraft(
    draft: ProductDraft,
    confirmation: { confirmed: boolean },
  ): Promise<ServiceResult<Product>>;
}
