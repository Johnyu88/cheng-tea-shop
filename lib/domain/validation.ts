import { domainError } from "./errors";
import type { Money } from "./types";
import type { ServiceResult } from "./result";

export const assertValidMoney = (money: Money): ServiceResult<Money> => {
  if (
    money.currency !== "TWD" ||
    !Number.isFinite(money.amount) ||
    !Number.isInteger(money.amount) ||
    money.amount < 0
  ) {
    return {
      ok: false,
      error: domainError("invalid-draft", "金額必須是非負整數的新台幣金額。", false),
    };
  }

  return { ok: true, value: money };
};

export const isValidQuantity = (quantity: number): boolean =>
  Number.isInteger(quantity) && quantity > 0;
