import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import { createPasswordAuthProvider, merchantAuthStatus } from "@/lib/server/merchant-auth-provider";
import { issueDemoMerchantAuthCookie, verifyDemoMerchantCookie } from "@/lib/server/demo-access";
import { POST, GET } from "@/app/api/demo/admin/session/route";
const password = randomBytes(12).toString("base64url");
const token = randomBytes(16).toString("hex");
const secret = randomBytes(32).toString("hex");
const origin = "https://cheng-tea-password-demo.onrender.com";
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DEMO_COMMERCE_CLOUD", "enabled");
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "");
  vi.stubEnv("DEMO_COMMERCE_LAN", "");
  vi.stubEnv("DEMO_CLOUD_ORIGIN", origin);
  vi.stubEnv("DEMO_PREVIEW_TOKEN_SHA256", createHash("sha256").update(token).digest("hex"));
  vi.stubEnv("DEMO_MERCHANT_SECRET", secret);
  vi.stubEnv("DEMO_AUTH_PROVIDER", "password");
  vi.stubEnv("DEMO_AUTH_ENV", "isolated-demo");
  vi.stubEnv("DEMO_AUTH_PASSWORD", password);
});
afterEach(() => vi.unstubAllEnvs());
test("password provider fails closed outside explicit independent demo origin and configuration", () => {
  expect(merchantAuthStatus()).toEqual({ provider: "password", state: "ready", simulated: false });
  for (const [name, value] of [["DEMO_AUTH_ENV", ""], ["DEMO_CLOUD_ORIGIN", "https://cheng-tea-shop.onrender.com"],
    ["DEMO_AUTH_PASSWORD", ""], ["DEMO_AUTH_PASSWORD", secret], ["DEMO_COMMERCE_CLOUD", ""]] as const) {
    const previous = process.env[name]; process.env[name] = value;
    expect(merchantAuthStatus().state).toBe("password-pending");
    expect(createPasswordAuthProvider().verify({ password })).toBe(false);
    process.env[name] = previous;
  }
});
test("three-character demo password works only in the explicitly isolated origin", () => {
  process.env.DEMO_AUTH_PASSWORD = "abc";
  expect(createPasswordAuthProvider().verify({ password: "abc" })).toBe(true);
  process.env.DEMO_CLOUD_ORIGIN = "https://cheng-tea-shop.onrender.com";
  expect(createPasswordAuthProvider().verify({ password: "abc" })).toBe(false);
});
test("constant-time password verification throttles attempts and locks after five wrong guesses", () => {
  let at = 100000;
  const provider = createPasswordAuthProvider({ now: () => at });
  for (let i = 0; i < 5; i++) { expect(provider.verify({ password: "incorrect" })).toBe(false); at += 1000; }
  expect(provider.verify({ password })).toBe(false);
  at += 15 * 60 * 1000;
  expect(provider.verify({ password })).toBe(true);
  expect(provider.verify({ password })).toBe(false);
  at += 1000;
  expect(provider.verify({ password })).toBe(true);
});
test("same session cookie revokes on password rotation, provider change or isolation removal", () => {
  const cookie = issueDemoMerchantAuthCookie({ password })!;
  expect(cookie).toContain("HttpOnly; Secure; SameSite=Strict");
  expect(cookie).not.toContain(password);
  expect(cookie).not.toContain(secret);
  expect(verifyDemoMerchantCookie(cookie)).toBe(true);
  process.env.DEMO_AUTH_PASSWORD = password + "rotated";
  expect(verifyDemoMerchantCookie(cookie)).toBe(false);
  process.env.DEMO_AUTH_PASSWORD = password;
  process.env.DEMO_AUTH_PROVIDER = "sms";
  expect(verifyDemoMerchantCookie(cookie)).toBe(false);
  process.env.DEMO_AUTH_PROVIDER = "password";
  delete process.env.DEMO_AUTH_ENV;
  expect(verifyDemoMerchantCookie(cookie)).toBe(false);
});
test("guarded password route returns generic errors and status without exposing secret", async () => {
  const headers = { host: "cheng-tea-password-demo.onrender.com", origin,
    authorization: "Basic " + Buffer.from("preview:" + token).toString("base64"),
    "content-type": "application/json", "sec-fetch-site": "same-origin" };
  const status = await GET(new Request(origin + "/api/demo/admin/session", { headers }));
  expect(JSON.stringify(await status.json())).not.toContain(password);
  const rejected = await POST(new Request(origin + "/api/demo/admin/session", {
    method: "POST", headers: { ...headers, origin: "https://attacker.example" }, body: JSON.stringify({ password }),
  }));
  expect(rejected.status).toBe(403);
  expect(rejected.headers.get("set-cookie")).toBeNull();
});

import { POST as issueOtp } from "@/app/api/demo/admin/otp/route";
import { POST as operatorInbox } from "@/app/api/demo/admin/otp/operator/route";
test("password selection disables both SMS issuance and operator inbox routes", async () => {
  process.env.DEMO_MERCHANT_PHONE = "0912000000";
  process.env.DEMO_MERCHANT_PHONE_CONFIRMED = "yes";
  process.env.DEMO_MERCHANT_SMS_MODE = "simulated";
  const headers = { host: "cheng-tea-password-demo.onrender.com", origin,
    authorization: "Basic " + Buffer.from("preview:" + token).toString("base64"),
    "content-type": "application/json", "x-demo-merchant-operator": secret };
  const response = await issueOtp(new Request(origin + "/api/demo/admin/otp", {
    method: "POST", headers, body: JSON.stringify({ phone: "0912000000" }),
  }));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ ok: false, error: "無法傳送驗證碼。請確認本人綁定、簡訊設定，並稍後重試。", errorCode: expect.stringMatching(/^[2-9A-Z]{6}$/) });
  const inbox = await operatorInbox(new Request(origin + "/api/demo/admin/otp/operator", {
    method: "POST", headers, body: JSON.stringify({ challengeId: "a".repeat(32) }),
  }));
  expect(inbox.status).toBe(403);
  for (const name of ["DEMO_MERCHANT_PHONE", "DEMO_MERCHANT_PHONE_CONFIRMED", "DEMO_MERCHANT_SMS_MODE"]) delete process.env[name];
});

test("Acer HTTPS staging accepts only its configured demo password and binds the signed session to that origin", async () => {
  const acerOrigin = "https://tea-staging.home.arpa";
  const acerPassword = "Acer-staging-password-2026";
  vi.stubEnv("DEMO_COMMERCE_CLOUD", "");
  vi.stubEnv("DEMO_COMMERCE_ACER", "enabled");
  vi.stubEnv("DEMO_ACER_ORIGIN", acerOrigin);
  vi.stubEnv("DEMO_AUTH_ENV", "acer-demo");
  vi.stubEnv("DEMO_AUTH_PROVIDER", "password");
  vi.stubEnv("DEMO_AUTH_PASSWORD", acerPassword);
  const provider = createPasswordAuthProvider();
  expect(provider.status().state).toBe("ready");
  expect(provider.verify({ password: acerPassword })).toBe(true);
  expect(provider.sessionContext()).toContain(acerOrigin);
  await new Promise(resolve => setTimeout(resolve, 1_100));
  const cookie = issueDemoMerchantAuthCookie({ password: acerPassword });
  expect(cookie).toContain("__Host-demo_merchant=");
  expect(cookie).toContain("Secure;");
});
