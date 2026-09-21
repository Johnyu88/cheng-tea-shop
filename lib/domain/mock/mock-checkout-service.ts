import { domainError } from "../errors";
import type { CheckoutService } from "../checkout-service";
import type { Cart, CheckoutDraft, CheckoutReceipt } from "../types";
import type { ServiceResult } from "../result";

const invalid = <T>(message: string): ServiceResult<T> => ({
  ok: false,
  error: domainError("invalid-draft", message, false),
});

export const createMockCheckoutService = (): CheckoutService => ({
  async validate(draft: CheckoutDraft, _cart: Cart): Promise<ServiceResult<CheckoutDraft>> {
    if (draft.phone.trim().length === 0) return invalid("請填寫手機號碼。");
    if (draft.email !== undefined && !/^\S+@\S+\.\S+$/.test(draft.email)) {
      return invalid("Email 格式不正確。");
    }
    if (draft.deliveryMethod === "home-delivery" && draft.paymentMethod === "pay-at-store") {
      return invalid("宅配不能選擇到店付款。");
    }
    if (draft.deliveryMethod === "store-pickup" && draft.paymentMethod === "line-pay") {
      return invalid("到店取貨目前不能選擇 LINE Pay。");
    }
    return { ok: true, value: { ...draft } };
  },

  async submit(_draft: CheckoutDraft, _cart: Cart): Promise<ServiceResult<CheckoutReceipt>> {
    return {
      ok: false,
      error: domainError("checkout-unavailable", "結帳服務正在準備中。", true),
    };
  },
});
