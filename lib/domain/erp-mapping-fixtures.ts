export const erpNextFixture = {
  product: {
    item_code: "tea-oolong-001",
    item_name: "合成烏龍茶",
    item_group: "oolong",
    disabled: false,
    variants: [{ item_code: "tea-oolong-001-150g", item_name: "150g", standard_rate: 680 }],
  },
  inventory: { item_code: "tea-oolong-001-150g", actual_qty: 12, reserved_qty: 0 },
  customer: { name: "customer-synthetic-001" },
  order: {
    name: "order-synthetic-001",
    status: "To Deliver and Bill",
    grand_total: 1360,
    customer: "customer-synthetic-001",
    items: [{ item_code: "tea-oolong-001-150g", qty: 2, rate: 680 }],
  },
} as const;

export const vendureFixture = {
  product: {
    id: "tea-oolong-001",
    name: "合成烏龍茶",
    enabled: true,
    variants: [{ id: "tea-oolong-001-150g", sku: "tea-oolong-001-150g", name: "150g", price: 680 }],
  },
  inventory: { sku: "tea-oolong-001-150g", stockOnHand: 12, stockAllocated: 0 },
  customer: { id: "customer-synthetic-001" },
  order: {
    code: "order-synthetic-001",
    state: "PaymentSettled",
    totalWithTax: 1360,
    customer: { id: "customer-synthetic-001" },
    lines: [{ productVariant: { sku: "tea-oolong-001-150g" }, quantity: 2, unitPriceWithTax: 680 }],
  },
} as const;
