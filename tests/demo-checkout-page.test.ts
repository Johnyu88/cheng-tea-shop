import { describe, expect, test } from "vitest";
import { normalizeDemoCheckoutDraft } from "@/features/demo/components/demo-checkout-page";

const base = {
  name: "測試顧客",
  phone: "0912000000",
  deliveryMethod: "home-delivery" as const,
  address: "台北市中正區測試路 1 號",
  paymentMethod: "bank-transfer" as const,
};

describe("demo checkout draft boundary", () => {
  test("omits a blank optional email so the server can accept the draft", () => {
    expect(normalizeDemoCheckoutDraft({ ...base, email: "   " })).toEqual(base);
  });

  test("preserves a non-empty email for server validation", () => {
    expect(normalizeDemoCheckoutDraft({ ...base, email: " tea@example.tw " }).email).toBe("tea@example.tw");
  });
});
