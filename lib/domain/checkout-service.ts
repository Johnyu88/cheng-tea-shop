import type { Cart, CheckoutDraft, CheckoutReceipt } from "./types";
import type { ServiceResult } from "./result";

export interface CheckoutService {
  validate(draft: CheckoutDraft, cart: Cart): Promise<ServiceResult<CheckoutDraft>>;
  submit(draft: CheckoutDraft, cart: Cart): Promise<ServiceResult<CheckoutReceipt>>;
}
