import { describe, expect, it } from "vitest";
import {
  mapErpNextPhysicalSnapshot,
  type ErpNextPhysicalSnapshot,
} from "@/lib/domain/erpnext-physical-mapping";

const snapshot = {
  item: {
    item_code: "SYN-TEA-001",
    item_name: "Synthetic Tea Test",
    item_group: "Products",
    stock_uom: "Nos",
    disabled: 0,
  },
  price: {
    item_code: "SYN-TEA-001",
    price_list: "Standard Selling",
    price_list_rate: 150,
    currency: "TWD",
  },
  bin: {
    item_code: "SYN-TEA-001",
    warehouse: "Synthetic Stores - STC",
    actual_qty: 10,
    reserved_qty: 0,
  },
  customer: { name: "Synthetic Customer" },
  order: {
    name: "SAL-ORD-2026-00001",
    status: "To Deliver and Bill",
    grand_total: 300,
    customer: "Synthetic Customer",
  },
} satisfies ErpNextPhysicalSnapshot;
describe("Phase 10-C physical ERPNext mapping", () => {
  it("maps captured real API response shapes into project DTOs", () => {
    const mapped = mapErpNextPhysicalSnapshot(snapshot);

    expect(mapped.product).toMatchObject({
      ok: true,
      value: {
        id: "SYN-TEA-001",
        name: "Synthetic Tea Test",
        variants: [{ id: "SYN-TEA-001", price: { currency: "TWD", amount: 150 } }],
      },
    });
    expect(mapped.inventory).toEqual({
      ok: true,
      value: { variantId: "SYN-TEA-001", availableQuantity: 10, status: "available" },
    });
    expect(mapped.customer).toEqual({
      ok: true,
      value: { externalId: "Synthetic Customer" },
    });
    expect(mapped.order).toEqual({
      ok: true,
      value: {
        orderReference: "SAL-ORD-2026-00001",
        status: "confirmed",
        total: { currency: "TWD", amount: 300 },
        customerReference: "Synthetic Customer",
      },
    });
  });
});