import { domainError } from "./errors";
import type { ServiceResult } from "./result";
import type {
  ErpOrderSyncDto,
  ErpProductUpsertDto,
  ProductDraftDto,
} from "./integration-types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isMoney = (value: unknown): boolean =>
  isRecord(value) && value.currency === "TWD" && Number.isInteger(value.amount) && (value.amount as number) >= 0;

const invalid = <T>(
  code: "invalid-publishing-request" | "invalid-erp-request",
  message: string,
): ServiceResult<T> => ({ ok: false, error: domainError(code, message, false) });

export const validateProductDraftDto = (value: unknown): ServiceResult<ProductDraftDto> => {
  if (
    !isRecord(value) ||
    typeof value.name !== "string" ||
    value.name.trim().length === 0 ||
    typeof value.specification !== "string" ||
    value.specification.trim().length === 0 ||
    !isMoney(value.price) ||
    !["wild-mountain", "white", "green", "yellow", "oolong", "black", "flower", "dark", "special", "aged", "other"].includes(value.category as string) ||
    !["available", "sold-out"].includes(value.inventoryStatus as string) ||
    !Array.isArray(value.tasteTags) ||
    !value.tasteTags.every((tag) => ["light", "sweet", "rich", "roasted"].includes(tag as string)) ||
    (value.photos !== undefined && (!Array.isArray(value.photos) || value.photos.length > 3))
  ) {
    return invalid("invalid-publishing-request", "商品草稿資料無效。");
  }

  return { ok: true, value: value as ProductDraftDto };
};

export const validateErpProductUpsertDto = (value: unknown): ServiceResult<ErpProductUpsertDto> => {
  if (
    !isRecord(value) ||
    typeof value.productId !== "string" ||
    value.productId.trim().length === 0 ||
    typeof value.name !== "string" ||
    value.name.trim().length === 0 ||
    (value.publication !== "draft" && value.publication !== "published")
  ) {
    return invalid("invalid-erp-request", "ERP 資料無效。");
  }

  return { ok: true, value: value as ErpProductUpsertDto };
};

export const validateErpOrderSyncDto = (value: unknown): ServiceResult<ErpOrderSyncDto> => {
  if (
    !isRecord(value) ||
    typeof value.orderReference !== "string" ||
    value.orderReference.trim().length === 0 ||
    !isMoney(value.total) ||
    !Number.isInteger(value.lineCount) ||
    (value.lineCount as number) < 1
  ) {
    return invalid("invalid-erp-request", "ERP 資料無效。");
  }

  return { ok: true, value: value as ErpOrderSyncDto };
};
