import { domainError } from "../errors";
import type { CheckoutService } from "../checkout-service";
import type { Cart, CheckoutDraft, CheckoutReceipt } from "../types";
import type { ServiceResult } from "../result";
import { normalizeTaiwanMobile } from "../phone";
import { assessDemoAddress } from "../demo-address";

const invalid = <T>(message: string): ServiceResult<T> => ({
  ok: false,
  error: domainError("invalid-draft", message, false),
});

const cartEmpty = <T>(): ServiceResult<T> => ({
  ok: false,
  error: domainError("cart-empty", "購物車目前沒有茶品，請先選擇茶品。", true),
});

const isValidEmail = (email: string): boolean => /^\S+@\S+\.\S+$/.test(email);

export type MockCheckoutScenario = "happy" | "payment-failure";

export const createMockCheckoutService = (
  options: { scenario?: MockCheckoutScenario } = {},
): CheckoutService => ({
  async validate(draft: CheckoutDraft, cart: Cart): Promise<ServiceResult<CheckoutDraft>> {
    if (cart.lines.length === 0) return cartEmpty();
    if (draft.name.trim().length === 0) return invalid("請填寫姓名。");
    if (draft.phone.trim().length === 0) return invalid("請填寫手機號碼。");
    const phone = normalizeTaiwanMobile(draft.phone);
    if (phone === null) return invalid("請填寫正確的台灣手機號碼。");
    if (draft.email !== undefined && !isValidEmail(draft.email)) {
      return invalid("Email 格式不正確。");
    }
    const address = assessDemoAddress(draft.deliveryMethod, draft.address);
    if (address.status === "invalid") return invalid(address.reason);
    if (!["bank-transfer", "cash", "phone-confirmation", "line-voice-confirmation"].includes(draft.paymentMethod)) {
      return invalid("請選擇銀行轉帳、現金、電話確認或 LINE 語音確認。");
    }
    return { ok: true, value: { ...draft, phone, ...(address.status === "needs-review" ? { address: address.normalized } : {}) } };
  },

  async submit(draft: CheckoutDraft, cart: Cart): Promise<ServiceResult<CheckoutReceipt>> {
    const validation = await this.validate(draft, cart);
    if (!validation.ok) return validation;
    if (options.scenario === "payment-failure") {
      return {
        ok: false,
        error: domainError("payment-failed", "付款未完成，請確認付款方式後再試一次。", true),
      };
    }
    return {
      ok: true,
      value: {
        orderReference: "MOCK-ORDER-001",
        status: "confirmed",
        total: { ...cart.subtotal },
      },
    };
  },
});
