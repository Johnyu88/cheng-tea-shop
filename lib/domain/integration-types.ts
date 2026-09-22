import type { Cart, CheckoutDraft, CheckoutReceipt, Money, Page, Product, ProductDraft } from "./types";

export type CatalogProductDto = Product;
export type CatalogPageDto = Page<CatalogProductDto>;
export type CartDto = Cart;
export type CheckoutRequestDto = { draft: CheckoutDraft; cart: CartDto };
export type CheckoutReceiptDto = CheckoutReceipt;
export type ProductDraftDto = ProductDraft;

export type PaymentMethod = CheckoutDraft["paymentMethod"];

export type PaymentRequestDto = {
  orderReference: string;
  method: PaymentMethod;
  amount: Money;
};

export type PaymentResultDto = {
  status: "simulated" | "failed";
  reference: string | null;
  amount: Money;
};

export type ShippingQuoteRequestDto = {
  orderReference: string;
  deliveryMethod: CheckoutDraft["deliveryMethod"];
  destination: string | null;
};

export type ShippingQuoteDto = {
  serviceable: boolean;
  amount: Money;
  deliveryMethod: CheckoutDraft["deliveryMethod"];
};

export type FulfillmentRequestDto = ShippingQuoteRequestDto;

export type FulfillmentResultDto = {
  status: "simulated" | "unavailable";
  reference: string | null;
};

export type ErpProductUpsertDto = {
  productId: string;
  name: string;
  publication: Product["publication"];
};

export type ErpOrderSyncDto = {
  orderReference: string;
  total: Money;
  lineCount: number;
};

export type ErpSyncResultDto = {
  status: "simulated" | "failed";
  reference: string | null;
};

export type AdapterErrorSource = "payment" | "logistics" | "erp";

export type AdapterError = {
  source: AdapterErrorSource;
  code: string;
  message: string;
  retryable: boolean;
};
