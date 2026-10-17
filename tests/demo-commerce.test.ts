import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createLocalDemoCommerce } from "@/lib/server/demo-commerce";
import { createDemoOtpService } from "@/lib/domain/demo-otp-service";
import { createDemoOrderService } from "@/lib/domain/demo-order-service";

const phone = "0912000000";
const code = "123456";
const line = { productId: "mock-tea-001", variantId: "mock-tea-001-variant", quantity: 2 };
const draft = {
  name: "測試顧客", phone, deliveryMethod: "store-pickup" as const,
  paymentMethod: "cash" as const,
};
const setup = (reviewAddress?: (address: string) => boolean) => {
  const orders = createDemoOrderService();
  const service = createLocalDemoCommerce({
    otp: createDemoOtpService({ codeFactory: () => code }), orders,
    ...(reviewAddress ? { reviewAddress } : {}),
  });
  const receipt = service.issueOtp(phone);
  const request = {
    phone, challengeId: receipt.challengeId, code, draft,
    lines: [line],
  };
  return { orders, service, receipt, request };
};
beforeEach(() => { process.env.DEMO_COMMERCE_LOCAL = "enabled"; });
afterEach(() => { delete process.env.DEMO_COMMERCE_LOCAL; });

describe("local-only demo commerce", () => {
  test("is disabled by default and cannot be used after disable", () => {
    delete process.env.DEMO_COMMERCE_LOCAL;
    expect(() => createLocalDemoCommerce({
      otp: createDemoOtpService(), orders: createDemoOrderService(),
    })).toThrow("disabled");
    process.env.DEMO_COMMERCE_LOCAL = "enabled";
    const { service } = setup();
    delete process.env.DEMO_COMMERCE_LOCAL;
    expect(() => service.issueOtp(phone)).toThrow("disabled");
  });
  test("never returns an OTP, rejects real phone, validates one-time code", () => {
    const { service, request, receipt } = setup();
    expect(JSON.stringify(receipt)).not.toContain(code);
    expect(() => service.issueOtp("0912345678")).toThrow();
    expect(() => service.placeOrder({ ...request, code: "000000" })).toThrow("OTP");
    expect(service.placeOrder(request).total).toEqual({ currency: "TWD", amount: 1020 });
    expect(() => service.placeOrder(request)).toThrow("OTP");
  });
  test("recomputes pricing and rejects tampering, unavailable products and extra fields", () => {
    const { service, request } = setup();
    expect(() => service.placeOrder({
      ...request, lines: [{ ...line, unitPrice: { amount: 1 }, quantity: 1 }],
    })).toThrow("Invalid line");
    expect(() => service.placeOrder({
      ...request, lines: [{ ...line, productId: "mock-tea-048", variantId: "mock-tea-048-variant" }],
    })).toThrow("Unavailable line");
    expect(() => service.placeOrder({ ...request, admin: true })).toThrow("Invalid order request");
    const placed = service.placeOrder(request);
    expect(service.lookup(placed.orderId, placed.accessSecret)?.total.amount).toBe(1020);
    expect(service.lookup(placed.orderId, "000")).toBeNull();
  });
  test("requires explicit human address review and matching verified phone", () => {
    const { service, request } = setup();
    const home = {
      ...request, draft: {
        ...draft, deliveryMethod: "home-delivery", paymentMethod: "bank-transfer",
        address: "台北市中正區測試路 1 號",
      },
    };
    expect(() => service.placeOrder(home)).toThrow("review");
    expect(() => service.placeOrder({ ...home, addressReviewed: true })).toThrow("Invalid order request");
    const approved = setup(address => address === "台北市中正區測試路 1 號");
    expect(() => approved.service.placeOrder({ ...approved.request, draft: {
      ...home.draft, phone: "0912000001" } })).toThrow("contact");
    expect(approved.service.placeOrder({ ...approved.request, draft: {
      ...home.draft, paymentMethod: "line-voice-confirmation" } }).orderId).toMatch(/^DEMO-/);
    const approvedAgain = setup(address => address === "台北市中正區測試路 1 號");
    expect(approvedAgain.service.placeOrder({ ...approvedAgain.request, draft: home.draft }).orderId).toMatch(/^DEMO-/);
  });
  test("returns order access even if simulated notification queue fails after create", () => {
    const underlying = createDemoOrderService();
    const service = createLocalDemoCommerce({
      otp: createDemoOtpService({ codeFactory: () => code }),
      orders: { ...underlying, queueNotification: () => { throw new Error("queue unavailable"); } },
    });
    const receipt = service.issueOtp(phone);
    const placed = service.placeOrder({ phone, challengeId: receipt.challengeId, code, draft, lines: [line] });
    expect(placed.notificationStatus).toBe("queue-failed");
    expect(service.lookup(placed.orderId, placed.accessSecret)?.status).toBe("confirmed");
  });
  test("queues simulated notifications once per audience and creates unique orders", () => {
    const { service, orders, request } = setup();
    const first = service.placeOrder(request);
    expect(first.notificationStatus).toBe("simulated-queued");
    expect(orders.listNotifications(first.orderId).map(n => n.audience)).toEqual(["customer", "merchant"]);
    const secondChallenge = service.issueOtp("0912000001");
    const second = service.placeOrder({
      ...request, phone: "0912000001", draft: { ...draft, phone: "0912000001" },
      challengeId: secondChallenge.challengeId,
    });
    expect(second.orderId).not.toBe(first.orderId);
    expect(second.accessSecret).not.toBe(first.accessSecret);
  });
});
