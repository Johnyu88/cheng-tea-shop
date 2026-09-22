import type { DomainError } from "./errors";
import type { Money, Product, ProductVariant } from "./types";
import type { ServiceResult } from "./result";

export type CanonicalInventory = {
  variantId: string;
  availableQuantity: number;
  status: "available" | "sold-out";
};

export type CanonicalOrder = {
  orderReference: string;
  status: "pending" | "confirmed" | "cancelled" | "fulfilled";
  total: Money;
  customerReference: string;
};

export type CanonicalCustomerReference = { externalId: string };

export type ErpMappingFixture = {
  product: unknown;
  inventory: unknown;
  customer: unknown;
  order: unknown;
};

export type ErpMappingAdapter = {
  provider: string;
  mapProduct(payload: unknown): ServiceResult<Product>;
  mapInventory(payload: unknown): ServiceResult<CanonicalInventory>;
  mapCustomerReference(payload: unknown): ServiceResult<CanonicalCustomerReference>;
  mapOrder(payload: unknown): ServiceResult<CanonicalOrder>;
};

type MappingError = DomainError;

const invalidMapping = (): MappingError => ({
  code: "erp-mapping-invalid",
  message: "ERP product payload is invalid",
  retryable: false,
});

const invalidFieldMapping = (): MappingError => ({
  code: "erp-mapping-invalid",
  message: "ERP mapping payload is invalid",
  retryable: false,
});

const money = (amount: number): Money => ({ currency: "TWD", amount });
const inventoryStatus = (quantity: number): CanonicalInventory["status"] =>
  quantity > 0 ? "available" : "sold-out";

const product = (
  id: string,
  name: string,
  variantId: string,
  specification: string,
  price: number,
): Product => {
  const variant: ProductVariant = {
    id: variantId,
    specification,
    price: money(price),
    inventoryStatus: "available",
    maxQuantity: 12,
  };
  return {
    id,
    slug: id,
    name,
    category: "oolong",
    tasteTags: [],
    summary: "Synthetic ERP mapping fixture",
    image: { src: null, alt: `${name} placeholder`, isPlaceholder: true },
    variants: [variant],
    publication: "published",
  };
};

const erpNextAdapter: ErpMappingAdapter = {
  provider: "erpnext",
  mapProduct(payload) {
    const value = payload as { item_code?: unknown; item_name?: unknown; variants?: unknown };
    const variant = Array.isArray(value.variants) ? value.variants[0] as Record<string, unknown> | undefined : undefined;
    if (
      typeof value.item_code !== "string" ||
      typeof value.item_name !== "string" ||
      typeof variant?.item_code !== "string" ||
      typeof variant.item_name !== "string" ||
      typeof variant.standard_rate !== "number"
    ) return { ok: false, error: invalidMapping() };
    return { ok: true, value: product(value.item_code, value.item_name, variant.item_code, variant.item_name, variant.standard_rate) };
  },
  mapInventory(payload) {
    const value = payload as { item_code?: unknown; actual_qty?: unknown; reserved_qty?: unknown };
    if (typeof value.item_code !== "string" || typeof value.actual_qty !== "number" || typeof value.reserved_qty !== "number") return { ok: false, error: invalidFieldMapping() };
    const availableQuantity = Math.max(0, value.actual_qty - value.reserved_qty);
    return { ok: true, value: { variantId: value.item_code, availableQuantity, status: inventoryStatus(availableQuantity) } };
  },
  mapCustomerReference(payload) {
    const value = payload as { name?: unknown };
    return typeof value.name === "string" ? { ok: true, value: { externalId: value.name } } : { ok: false, error: invalidFieldMapping() };
  },
  mapOrder(payload) {
    const value = payload as { name?: unknown; status?: unknown; grand_total?: unknown; customer?: unknown };
    if (typeof value.name !== "string" || typeof value.grand_total !== "number" || typeof value.customer !== "string") return { ok: false, error: invalidFieldMapping() };
    return { ok: true, value: { orderReference: value.name, status: value.status === "Completed" ? "fulfilled" : "confirmed", total: money(value.grand_total), customerReference: value.customer } };
  },
};

const vendureAdapter: ErpMappingAdapter = {
  provider: "vendure",
  mapProduct(payload) {
    const value = payload as { id?: unknown; name?: unknown; variants?: unknown };
    const variant = Array.isArray(value.variants) ? value.variants[0] as Record<string, unknown> | undefined : undefined;
    if (typeof value.id !== "string" || typeof value.name !== "string" || typeof variant?.id !== "string" || typeof variant.name !== "string" || typeof variant.price !== "number") return { ok: false, error: invalidMapping() };
    return { ok: true, value: product(value.id, value.name, variant.id, variant.name, variant.price) };
  },
  mapInventory(payload) {
    const value = payload as { sku?: unknown; stockOnHand?: unknown; stockAllocated?: unknown };
    if (typeof value.sku !== "string" || typeof value.stockOnHand !== "number" || typeof value.stockAllocated !== "number") return { ok: false, error: invalidFieldMapping() };
    const availableQuantity = Math.max(0, value.stockOnHand - value.stockAllocated);
    return { ok: true, value: { variantId: value.sku, availableQuantity, status: inventoryStatus(availableQuantity) } };
  },
  mapCustomerReference(payload) {
    const value = payload as { id?: unknown };
    return typeof value.id === "string" ? { ok: true, value: { externalId: value.id } } : { ok: false, error: invalidFieldMapping() };
  },
  mapOrder(payload) {
    const value = payload as { code?: unknown; state?: unknown; totalWithTax?: unknown; customer?: { id?: unknown } };
    if (typeof value.code !== "string" || typeof value.totalWithTax !== "number" || typeof value.customer?.id !== "string") return { ok: false, error: invalidFieldMapping() };
    const status = value.state === "Cancelled" ? "cancelled" : value.state === "Fulfilled" ? "fulfilled" : "confirmed";
    return { ok: true, value: { orderReference: value.code, status, total: money(value.totalWithTax), customerReference: value.customer.id } };
  },
};

export const createErpMappingAdapters = () => ({ erpnext: erpNextAdapter, vendure: vendureAdapter });

export const mapWithErpAdapter = (adapter: ErpMappingAdapter, fixture: ErpMappingFixture) => ({
  product: adapter.mapProduct(fixture.product),
  inventory: adapter.mapInventory(fixture.inventory),
  customer: adapter.mapCustomerReference(fixture.customer),
  order: adapter.mapOrder(fixture.order),
});
