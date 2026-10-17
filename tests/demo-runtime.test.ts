import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocalDemoRuntime } from "@/lib/server/demo-runtime";

const directories: string[] = [];
const phone = "0912000000";
const code = "123456";
const draft = {
  name: "測試顧客",
  phone,
  email: "demo@example.test",
  deliveryMethod: "store-pickup" as const,
  paymentMethod: "cash" as const,
};
const draftWithoutEmail = {
  name: draft.name,
  phone: draft.phone,
  deliveryMethod: draft.deliveryMethod,
  paymentMethod: draft.paymentMethod,
};

beforeEach(() => {
  process.env.DEMO_COMMERCE_LOCAL = "enabled";
  process.env.DEMO_MERCHANT_SECRET = randomBytes(32).toString("hex");
});

afterEach(() => {
  delete process.env.DEMO_COMMERCE_LOCAL;
  delete process.env.DEMO_MERCHANT_SECRET;
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "demo-runtime-"));
  directories.push(directory);
  return createLocalDemoRuntime({ directory, otpCode: code });
}

describe("local demo runtime composition", () => {
  test("rejects an incorrect customer name for newly created orders", () => {
    const runtime = fixture();
    try {
      const checkoutChallenge = runtime.issueOtp(phone, "checkout");
      const placed = runtime.placeOrder({ phone, challengeId: checkoutChallenge.challengeId, code, draft: draftWithoutEmail,
        lines: [{ productId: "mock-tea-001", variantId: "mock-tea-001-variant", quantity: 1 }] });
      const lookupChallenge = runtime.issueOtp(phone, "lookup");
      expect(() => runtime.lookupOrder({ orderId: placed.orderId, accessSecret: placed.accessSecret,
        customerName: "其他顧客", phone, phoneLastThree: "000", challengeId: lookupChallenge.challengeId, code })).toThrow("Unable to verify demo order");
    } finally { runtime.close(); }
  });

  test("persists a checkout and records simulated email and merchant notifications", () => {
    const runtime = fixture();
    try {
      const challenge = runtime.issueOtp(phone, "checkout");
      const placed = runtime.placeOrder({
        phone,
        challengeId: challenge.challengeId,
        code,
        draft,
        lines: [{ productId: "mock-tea-001", variantId: "mock-tea-001-variant", quantity: 1 }],
      });

      expect(placed).toMatchObject({
        orderId: expect.stringMatching(/^DEMO-/),
        accessSecret: expect.stringMatching(/^[0-9a-f]{64}$/),
        notificationStatus: "simulated-queued",
      });
      expect(runtime.notifications(placed.orderId)).toMatchObject([
        { audience: "customer", path: "simulated-email", state: "queued" },
        { audience: "merchant", path: "merchant-inbox", state: "queued" },
      ]);
    } finally {
      runtime.close();
    }
  });

  test("requires high entropy access plus matching phone suffix and one-time OTP for lookup", () => {
    const runtime = fixture();
    try {
      const checkoutChallenge = runtime.issueOtp(phone, "checkout");
      const placed = runtime.placeOrder({
        phone,
        challengeId: checkoutChallenge.challengeId,
        code,
        draft: draftWithoutEmail,
        lines: [{ productId: "mock-tea-001", variantId: "mock-tea-001-variant", quantity: 1 }],
      });
      const lookupChallenge = runtime.issueOtp(phone, "lookup");
      expect(() => runtime.lookupOrder({
        orderId: placed.orderId,
        accessSecret: placed.accessSecret,
        phone,
        phoneLastThree: "999",
        challengeId: lookupChallenge.challengeId,
        code,
      })).toThrow("Unable to verify demo order");

      const order = runtime.lookupOrder({
        orderId: placed.orderId,
        accessSecret: placed.accessSecret,
        phone,
        phoneLastThree: "000",
        customerName: draft.name,
        challengeId: lookupChallenge.challengeId,
        code,
      });
      expect(order).toMatchObject({ orderId: placed.orderId, status: "confirmed" });
      expect(JSON.stringify(order)).not.toContain(placed.accessSecret);

      const otherPhone = "0912000001";
      const otherChallenge = runtime.issueOtp(otherPhone, "lookup");
      expect(() => runtime.lookupOrder({
        orderId: placed.orderId,
        accessSecret: placed.accessSecret,
        phone: otherPhone,
        phoneLastThree: "001",
        challengeId: otherChallenge.challengeId,
        code,
      })).toThrow("Unable to verify demo order");
    } finally {
      runtime.close();
    }
  });
});
