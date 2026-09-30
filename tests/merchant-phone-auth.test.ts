import { afterEach, beforeEach, expect, test } from "vitest";
import { randomBytes } from "node:crypto";
import { createMerchantPhoneAuth, merchantPhoneStatus } from "@/lib/server/merchant-phone-auth";

const phone = "0912000000";
const secret = randomBytes(32).toString("hex");
beforeEach(() => {
  process.env.DEMO_COMMERCE_LOCAL = "enabled";
  process.env.DEMO_MERCHANT_SECRET = secret;
  process.env.DEMO_MERCHANT_PHONE = phone;
  process.env.DEMO_MERCHANT_PHONE_CONFIRMED = "yes";
  process.env.DEMO_MERCHANT_SMS_MODE = "simulated";
});
afterEach(() => {
  for (const name of ["DEMO_COMMERCE_LOCAL", "DEMO_MERCHANT_SECRET", "DEMO_MERCHANT_PHONE",
    "DEMO_MERCHANT_PHONE_CONFIRMED", "DEMO_MERCHANT_SMS_MODE"]) delete process.env[name];
});
test("binding and transport fail closed without teacher confirmation", async () => {
  const auth = createMerchantPhoneAuth();
  delete process.env.DEMO_MERCHANT_PHONE_CONFIRMED;
  expect(merchantPhoneStatus().state).toBe("binding-pending");
  await expect(auth.issue(phone)).rejects.toThrow("本人確認");
  process.env.DEMO_MERCHANT_PHONE_CONFIRMED = "yes";
  delete process.env.DEMO_MERCHANT_SMS_MODE;
  expect(merchantPhoneStatus().state).toBe("sms-pending");
  await expect(auth.issue(phone)).rejects.toThrow("簡訊");
});
test("only bound phone receives random expiring single-use challenge; receipt never contains code", async () => {
  let now = 1000;
  const audit: unknown[] = [];
  const auth = createMerchantPhoneAuth({ now: () => now, audit: event => audit.push(event) });
  await expect(auth.issue("0912000001")).rejects.toThrow("無法");
  const receipt = await auth.issue(phone);
  expect(JSON.stringify(receipt)).not.toMatch(/code|0912000000/);
  expect(auth.takeForOperator(receipt.challengeId, "bad")).toBeNull();
  const code = auth.takeForOperator(receipt.challengeId, secret)!;
  expect(code).toMatch(/^\d{6}$/);
  expect(auth.takeForOperator(receipt.challengeId, secret)).toBeNull();
  expect(auth.verify(phone, receipt.challengeId, code)).toBe(true);
  expect(auth.verify(phone, receipt.challengeId, code)).toBe(false);
  expect(JSON.stringify(audit)).not.toContain(phone);
  expect(JSON.stringify(audit)).not.toContain(code);
  now += 60000;
  const next = await auth.issue(phone);
  const expiredCode = auth.takeForOperator(next.challengeId, secret)!;
  now += 300000;
  expect(auth.verify(phone, next.challengeId, expiredCode)).toBe(false);
});
test("resend throttle, maximum attempts and aggregate verify limits resist guessing", async () => {
  let now = 1000;
  const auth = createMerchantPhoneAuth({ now: () => now });
  const first = await auth.issue(phone);
  const code = auth.takeForOperator(first.challengeId, secret)!;
  await expect(auth.issue(phone)).rejects.toThrow("稍後");
  const wrong = code === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++) expect(auth.verify(phone, first.challengeId, wrong)).toBe(false);
  expect(auth.verify(phone, first.challengeId, code)).toBe(false);
  now += 60000;
  const second = await auth.issue(phone);
  expect(auth.verify(phone, first.challengeId, code)).toBe(false);
  const nextCode = auth.takeForOperator(second.challengeId, secret)!;
  for (let i = 0; i < 10; i++) auth.verify(phone, "f".repeat(32), wrong);
  expect(auth.verify(phone, second.challengeId, nextCode)).toBe(false);
});
test("inbox expiry and provisioning changes invalidate pending challenges", async () => {
  let now = 1000;
  const auth = createMerchantPhoneAuth({ now: () => now });
  const receipt = await auth.issue(phone);
  now += 300000;
  expect(auth.takeForOperator(receipt.challengeId, secret)).toBeNull();
  now += 60000;
  const next = await auth.issue(phone);
  const code = auth.takeForOperator(next.challengeId, secret)!;
  process.env.DEMO_MERCHANT_PHONE = "0912000001";
  expect(auth.verify(phone, next.challengeId, code)).toBe(false);
});

import { POST as merchantSession } from "@/app/api/demo/admin/session/route";
import { merchantPhoneAuth } from "@/lib/server/merchant-phone-auth";
import { verifyDemoMerchantCookie } from "@/lib/server/demo-access";
test("phone challenge establishes signed session through guarded HTTP route", async () => {
  const receipt = await merchantPhoneAuth.issue(phone);
  const code = merchantPhoneAuth.takeForOperator(receipt.challengeId, secret)!;
  const request = new Request("http://127.0.0.1:3021/api/demo/admin/session", {
    method: "POST", headers: { host: "127.0.0.1:3021", origin: "http://127.0.0.1:3021",
      "content-type": "application/json", "sec-fetch-site": "same-origin" },
    body: JSON.stringify({ phone, challengeId: receipt.challengeId, code }),
  });
  const response = await merchantSession(request);
  expect(response.status).toBe(200);
  const cookie = response.headers.get("set-cookie")!;
  expect(cookie).toContain("HttpOnly; Secure; SameSite=Strict");
  const sessionCookie = cookie.split(";")[0]!;
  expect(verifyDemoMerchantCookie(sessionCookie)).toBe(true);
  process.env.DEMO_MERCHANT_PHONE = "0912000001";
  expect(verifyDemoMerchantCookie(sessionCookie)).toBe(false);
  process.env.DEMO_MERCHANT_PHONE = phone;
  delete process.env.DEMO_MERCHANT_PHONE_CONFIRMED;
  expect(verifyDemoMerchantCookie(sessionCookie)).toBe(false);
  process.env.DEMO_MERCHANT_PHONE_CONFIRMED = "yes";
  delete process.env.DEMO_MERCHANT_SMS_MODE;
  expect(verifyDemoMerchantCookie(sessionCookie)).toBe(false);
  process.env.DEMO_MERCHANT_SMS_MODE = "simulated";
  const replay = await merchantSession(new Request(request.url, {
    method: "POST", headers: request.headers, body: JSON.stringify({ phone, challengeId: receipt.challengeId, code }),
  }));
  expect(replay.status).toBe(403);
});
