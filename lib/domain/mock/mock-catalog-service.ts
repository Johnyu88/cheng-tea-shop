import { domainError } from "../errors";
import type { CatalogService } from "../catalog-service";
import type { CatalogQuery, Page, Product, ProductSlug } from "../types";
import type { ServiceResult } from "../result";
import { mockCatalogFixture } from "./catalog-fixture";

export type MockCatalogScenario = "happy" | "empty" | "catalog-error";

type MockCatalogOptions = {
  scenario?: MockCatalogScenario;
  pageSize?: number;
};

const failure = <T>(code: "catalog-unavailable" | "product-not-found", message: string): ServiceResult<T> => ({
  ok: false,
  error: domainError(code, message, code === "catalog-unavailable"),
});

const pageStart = (cursor: string | undefined): number => {
  if (cursor === undefined) return 0;
  const parsed = Number.parseInt(cursor, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

export const createMockCatalogService = (options: MockCatalogOptions = {}): CatalogService => {
  const scenario = options.scenario ?? "happy";
  const pageSize = options.pageSize && options.pageSize > 0 ? Math.floor(options.pageSize) : 12;

  return {
    async listProducts(query: CatalogQuery = {}): Promise<ServiceResult<Page<Product>>> {
      if (scenario === "catalog-error") {
        return failure("catalog-unavailable", "目前無法取得茶品目錄，請稍後再試。 ");
      }
      if (scenario === "empty") {
        return { ok: true, value: { items: [], nextCursor: null, total: 0 } };
      }

      const filtered = mockCatalogFixture.filter((product) =>
        (query.category === undefined || product.category === query.category) &&
        (query.taste === undefined || product.tasteTags.includes(query.taste)),
      );
      const start = pageStart(query.cursor);
      const requestedSize = query.limit && query.limit > 0 ? Math.floor(query.limit) : pageSize;
      const items = filtered.slice(start, start + requestedSize);
      const nextStart = start + items.length;

      return {
        ok: true,
        value: {
          items,
          nextCursor: nextStart < filtered.length ? String(nextStart) : null,
          total: filtered.length,
        },
      };
    },

    async getProductBySlug(slug: ProductSlug): Promise<ServiceResult<Product>> {
      const product = scenario === "empty" ? undefined : mockCatalogFixture.find((item) => item.slug === slug);
      return product === undefined
        ? failure("product-not-found", "找不到這項茶品。")
        : { ok: true, value: product };
    },
  };
};
