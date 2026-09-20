import { domainError } from "../errors";
import type { PublishingService } from "../publishing-service";
import type { Product, ProductDraft } from "../types";
import type { ServiceResult } from "../result";
import { assertValidMoney } from "../validation";

const invalid = <T>(message: string): ServiceResult<T> => ({
  ok: false,
  error: domainError("invalid-draft", message, false),
});

const validateDraft = (draft: ProductDraft): ServiceResult<ProductDraft> => {
  if (draft.name.trim().length === 0 || draft.specification.trim().length === 0) {
    return invalid("茶名與規格不可為空白。");
  }
  const money = assertValidMoney(draft.price);
  if (!money.ok) return money;
  return { ok: true, value: { ...draft, tasteTags: [...draft.tasteTags] } };
};

const slugFor = (name: string, sequence: number): string => {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug.length > 0 ? slug : `mock-product-${sequence}`;
};

export const createMockPublishingService = (): PublishingService => {
  let sequence = 0;

  return {
    async saveDraft(draft): Promise<ServiceResult<ProductDraft>> {
      return validateDraft(draft);
    },

    async publishDraft(draft): Promise<ServiceResult<Product>> {
      const validated = validateDraft(draft);
      if (!validated.ok) return validated;
      sequence += 1;
      const value = validated.value;
      const id = `mock-published-${sequence}`;
      return {
        ok: true,
        value: {
          id,
          slug: slugFor(value.name, sequence),
          name: value.name,
          category: value.category,
          tasteTags: [...value.tasteTags],
          summary: value.summary ?? "",
          image: { src: null, alt: "商品照片準備中", isPlaceholder: true },
          variants: [
            {
              id: `${id}-variant`,
              specification: value.specification,
              price: { ...value.price },
              inventoryStatus: value.inventoryStatus,
              maxQuantity: 5,
            },
          ],
          publication: "published",
        },
      };
    },
  };
};
