import { domainError } from "./errors";
import type { CatalogService } from "./catalog-service";
import type { PublishingService } from "./publishing-service";
import type { CatalogQuery, Page, Product, ProductDraft, ProductSlug } from "./types";
import type { ServiceResult } from "./result";
import { createMockPublishingService } from "./mock/mock-publishing-service";

const failure = <T>(message: string): ServiceResult<T> => ({ ok: false, error: domainError("catalog-unavailable", message, true) });

async function demoJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<ServiceResult<T>> {
  try {
    const response = await fetch(input, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
    const payload = await response.json() as { ok?: boolean; value?: T; error?: string };
    if (!response.ok || !payload.ok || payload.value === undefined) return failure(payload.error ?? "Demo 資料目前無法取得，請稍後再試。");
    return { ok: true, value: payload.value };
  } catch {
    return failure("Demo 資料目前無法取得，請確認手機與主機在同一網路。");
  }
}

export const createDemoCatalogService = (): CatalogService => ({
  async listProducts(query: CatalogQuery = {}): Promise<ServiceResult<Page<Product>>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined) params.set(key, String(value));
    return demoJson<Page<Product>>(`/api/demo/catalog?${params.toString()}`);
  },
  async getProductBySlug(slug: ProductSlug): Promise<ServiceResult<Product>> {
    const result = await demoJson<Page<Product>>(`/api/demo/catalog?limit=50`);
    if (!result.ok) return result;
    let normalizedSlug = slug;
    try { normalizedSlug = decodeURIComponent(slug); } catch { /* keep the original for a stable not-found result */ }
    const product = result.value.items.find((item) => item.slug === normalizedSlug || item.slug === slug);
    return product ? { ok: true, value: product } : { ok: false, error: domainError("product-not-found", "找不到這項茶品。", false) };
  },
});

export const createDemoPublishingService = (): PublishingService => {
  const local = createMockPublishingService();
  return {
    generateSummary: local.generateSummary,
    saveDraft: local.saveDraft,
    async publishDraft(draft: ProductDraft, confirmation): Promise<ServiceResult<Product>> {
      if (!confirmation.confirmed) return { ok: false, error: domainError("invalid-draft", "發布前必須明確確認。", false) };
      return demoJson<Product>("/api/demo/catalog", { method: "POST", body: JSON.stringify(draft) }) as Promise<ServiceResult<Product>>;
    },
  };
};
