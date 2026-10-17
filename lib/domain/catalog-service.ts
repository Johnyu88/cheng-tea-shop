import type { DomainError } from "./errors";
import type { CatalogQuery, Page, Product, ProductSlug } from "./types";
import type { ServiceResult } from "./result";

export interface CatalogService {
  listProducts(query?: CatalogQuery): Promise<ServiceResult<Page<Product>>>;
  getProductBySlug(slug: ProductSlug): Promise<ServiceResult<Product>>;
}

export type CatalogErrorResult = ServiceResult<never> & { error: DomainError };
