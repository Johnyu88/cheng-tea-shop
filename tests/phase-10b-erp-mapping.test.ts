import { describe, expect, it } from "vitest";
import {
  createErpMappingAdapters,
  mapWithErpAdapter,
  type CanonicalOrder,
  type ErpMappingAdapter,
} from "@/lib/domain/erp-mapping-poc";
import { erpNextFixture, vendureFixture } from "@/lib/domain/erp-mapping-fixtures";

describe("Phase 10-B ERP-shaped mapping adapters", () => {
  it.each([
    ["ERPNext", createErpMappingAdapters().erpnext, erpNextFixture],
    ["Vendure", createErpMappingAdapters().vendure, vendureFixture],
  ] as const)("maps %s product, variant, inventory, order and customer references", (_name, adapter, fixture) => {
    const mapped = mapWithErpAdapter(adapter, fixture);

    expect(mapped.product.ok).toBe(true);
    expect(mapped.product.ok && mapped.product.value).toMatchObject({
      id: "tea-oolong-001",
      name: "合成烏龍茶",
      variants: [{ id: "tea-oolong-001-150g", price: { currency: "TWD", amount: 680 } }],
    });
    expect(mapped.inventory).toEqual({
      ok: true,
      value: { variantId: "tea-oolong-001-150g", availableQuantity: 12, status: "available" },
    });
    expect(mapped.customer).toEqual({ ok: true, value: { externalId: "customer-synthetic-001" } });
    expect(mapped.order).toEqual({
      ok: true,
      value: {
        orderReference: "order-synthetic-001",
        status: "confirmed",
        total: { currency: "TWD", amount: 1360 },
        customerReference: "customer-synthetic-001",
      } satisfies CanonicalOrder,
    });
  });

  it("normalizes malformed provider payloads into the same non-retryable mapping error", () => {
    const adapters = createErpMappingAdapters();
    const erpNextError = adapters.erpnext.mapProduct({ item_code: "missing-name" });
    const vendureError = adapters.vendure.mapProduct({ id: "missing-name" });

    expect(erpNextError).toEqual({
      ok: false,
      error: { code: "erp-mapping-invalid", message: "ERP product payload is invalid", retryable: false },
    });
    expect(vendureError).toEqual(erpNextError);
  });

  it("swaps an adapter without changing the canonical mapping consumer", () => {
    const adapters = createErpMappingAdapters();
    const swapped: ErpMappingAdapter = {
      ...adapters.vendure,
      provider: "swapped",
      mapCustomerReference: () => ({ ok: true, value: { externalId: "customer-synthetic-override" } }),
    };

    const result = mapWithErpAdapter(swapped, vendureFixture);

    expect(result.customer).toEqual({ ok: true, value: { externalId: "customer-synthetic-override" } });
    expect(result.product.ok).toBe(true);
    expect(result.order.ok).toBe(true);
  });
});
