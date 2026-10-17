import { domainError } from "./errors";
import type { CatalogService } from "./catalog-service";
import type { PublishingService, SavedProductDraft } from "./publishing-service";
import type { CatalogQuery, Page, Product, ProductDraft, ProductSlug } from "./types";
import type { ServiceResult } from "./result";
import { createMockPublishingService } from "./mock/mock-publishing-service";
import { withErrorCode } from "@/lib/domain/error-code";

const failure = <T>(message: string): ServiceResult<T> => ({ ok: false, error: domainError("catalog-unavailable", message, true) });

type DemoJsonResult<T> = ServiceResult<T> & { rejectedBeforeWrite?: boolean };

async function demoJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<DemoJsonResult<T>> {
  try {
    const response = await fetch(input, { credentials: "same-origin", ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
    const payload = await response.json() as { ok?: boolean; value?: T; error?: string; errorCode?: string };
    if (!response.ok || !payload.ok || payload.value === undefined) {
      const rejectedBeforeWrite = response.status === 400 && response.headers.get("x-demo-write-status") === "not-started";
      return { ...failure<T>(payload.error ? withErrorCode(payload.error, payload) : "Demo 資料目前無法取得，請稍後再試。"), rejectedBeforeWrite };
    }
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
    async saveDraft(draft: ProductDraft): Promise<ServiceResult<SavedProductDraft>> {
      const validated = await local.saveDraft(draft);
      if (!validated.ok) return validated;
      const persisted = await demoJson<Product>("/api/demo/catalog?publication=draft", { method: "POST", body: JSON.stringify(validated.value) });
      if (!persisted.ok && persisted.rejectedBeforeWrite) {
        const reason = persisted.error.message.includes("Merchant access required") ? "商家登入已失效，請重新登入後再儲存。" : persisted.error.message;
        return { ok: false, error: domainError("invalid-draft", `商品未儲存：${reason}`, true) };
      }
      if (!persisted.ok || !persisted.value.id) {
        return { ok: false, error: domainError("publishing-unavailable", "商品已送出，但尚未確認儲存；請先查詢商品清單，勿重複新增。", false) };
      }
      const verified = await demoJson<{ items: Product[] }>("/api/demo/catalog?limit=50&includeUnpublished=true");
      if (!verified.ok || !verified.value.items.some((item) => item.id === persisted.value.id)) {
        return { ok: false, error: domainError("publishing-unavailable", "商品可能已寫入，但尚未完成查詢確認；請先查詢商品清單，勿重複新增。", false) };
      }
      return { ok: true, value: { ...validated.value, id: persisted.value.id } };
    },
    async publishDraft(draft: ProductDraft, confirmation): Promise<ServiceResult<Product>> {
      if (!confirmation.confirmed) return { ok: false, error: domainError("invalid-draft", "發布前必須明確確認。", false) };
      return demoJson<Product>("/api/demo/catalog", { method: "POST", body: JSON.stringify(draft) }) as Promise<ServiceResult<Product>>;
    },
  };
};
