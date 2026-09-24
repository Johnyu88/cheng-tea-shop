import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { randomBytes } from "node:crypto";
import { assertLocalDemoPost, issueDemoMerchantCookie, verifyDemoMerchantCookie } from "@/lib/server/demo-access";
import { createLocalDemoOtpInbox } from "@/lib/server/demo-otp-inbox";

const origin = "http://127.0.0.1:3021";
const good = (headers: Record<string, string> = {}) => new Request(origin + "/api/demo/otp", {
  method: "POST", headers: {
    host: "127.0.0.1:3021", origin, "content-type": "application/json",
    "sec-fetch-site": "same-origin", ...headers,
  },
});
beforeEach(() => {
  process.env.DEMO_COMMERCE_LOCAL = "enabled";
  process.env.DEMO_MERCHANT_SECRET = randomBytes(32).toString("hex");
});
afterEach(() => {
  delete process.env.DEMO_COMMERCE_LOCAL;
  delete process.env.DEMO_MERCHANT_SECRET;
});

describe("local demo access primitives", () => {
  test("rejects disabled mode and refuses non-loopback or forged request metadata", () => {
    expect(() => assertLocalDemoPost(good(), "127.0.0.1")).not.toThrow();
    expect(() => assertLocalDemoPost(good(), "192.0.2.1")).toThrow();
    expect(() => assertLocalDemoPost(good({ origin: "http://evil.example" }), "127.0.0.1")).toThrow();
    expect(() => assertLocalDemoPost(good({ "x-forwarded-host": "evil.example" }), "127.0.0.1")).toThrow();
    expect(() => assertLocalDemoPost(good({ "sec-fetch-site": "cross-site" }), "127.0.0.1")).toThrow();
    delete process.env.DEMO_COMMERCE_LOCAL;
    expect(() => assertLocalDemoPost(good(), "127.0.0.1")).toThrow("disabled");
  });
  test("merchant cookie uses independent high-entropy credential, expiry, strict flags and MAC", () => {
    const key = process.env.DEMO_MERCHANT_SECRET!;
    expect(issueDemoMerchantCookie(randomBytes(32).toString("hex"), 1_000_000)).toBeNull();
    const header = issueDemoMerchantCookie(key, 1_000_000)!;
    expect(header).toContain("HttpOnly; Secure; SameSite=Strict; Path=/");
    expect(header).not.toContain(key);
    const cookie = header.split(";")[0]!;
    expect(verifyDemoMerchantCookie(cookie, 1_000_000 + 100)).toBe(true);
    expect(verifyDemoMerchantCookie(cookie, 1_000_000 + 1_800_000)).toBe(false);
    expect(verifyDemoMerchantCookie(cookie + "; " + cookie, 1_000_100)).toBe(false);
    const tampered = cookie.slice(0, -1) + (cookie.endsWith("0") ? "1" : "0");
    expect(verifyDemoMerchantCookie(tampered, 1_000_100)).toBe(false);
  });
  test("credential missing or weak fails closed", () => {
    delete process.env.DEMO_MERCHANT_SECRET;
    expect(() => issueDemoMerchantCookie("unknown")).toThrow("high-entropy");
    process.env.DEMO_MERCHANT_SECRET = "1234";
    expect(() => verifyDemoMerchantCookie(null)).toThrow("high-entropy");
  });
  test("operator inbox is disabled by default and after local mode ends", () => {
    delete process.env.DEMO_COMMERCE_LOCAL;
    expect(() => createLocalDemoOtpInbox()).toThrow("disabled");
    process.env.DEMO_COMMERCE_LOCAL = "enabled";
    const inbox = createLocalDemoOtpInbox();
    delete process.env.DEMO_COMMERCE_LOCAL;
    expect(() => inbox.otp.issue("0912000000")).toThrow("disabled");
    expect(() => inbox.takeForOperator("0912000000", "anything")).toThrow("disabled");
  });
  test("operator can take synthetic code once; it is absent from receipt and cannot be replayed", () => {
    const { otp, takeForOperator } = createLocalDemoOtpInbox();
    const receipt = otp.issue("0912000000");
    expect(JSON.stringify(receipt)).not.toMatch(/"code"/);
    expect(takeForOperator("0912000001", receipt.challengeId)).toBeNull();
    const code = takeForOperator("0912000000", receipt.challengeId);
    expect(code).toMatch(/^\d{6}$/);
    expect(takeForOperator("0912000000", receipt.challengeId)).toBeNull();
    expect(otp.verify("0912000000", receipt.challengeId, code!)).toBe(true);
    expect(otp.verify("0912000000", receipt.challengeId, code!)).toBe(false);
  });
});
