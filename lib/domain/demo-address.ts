export type DemoAddressAssessment =
  | { status: "not-applicable" }
  | { status: "invalid"; reason: string }
  | { status: "needs-review"; normalized: string };

/** Structural checks only. A human must confirm every synthetic home-delivery address. */
export function assessDemoAddress(
  deliveryMethod: "home-delivery" | "store-pickup",
  address?: string,
): DemoAddressAssessment {
  if (deliveryMethod === "store-pickup") return { status: "not-applicable" };
  if (address && /[\u0000-\u001f\u007f]/.test(address)) {
    return { status: "invalid", reason: "宅配地址包含無法使用的字元。" };
  }
  const normalized = address?.trim().replace(/\s+/g, " ") ?? "";
  if (normalized.length < 6 || normalized.length > 200) {
    return { status: "invalid", reason: "宅配請填寫地址（6 至 200 字）。" };
  }
  return { status: "needs-review", normalized };
}
