import type { CheckoutDraft } from "./types";
import type { ServiceResult } from "./result";

export interface CheckoutService {
  validate(draft: CheckoutDraft): Promise<ServiceResult<CheckoutDraft>>;
}
