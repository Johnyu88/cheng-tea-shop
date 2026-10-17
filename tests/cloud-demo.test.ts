import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { assertDemoEnabled, assertCloudDemoRequest, acerDemoRequested, acerDemoOrigin, assertAcerDemoRequest } from "@/lib/server/demo-cloud";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { issueDemoMerchantCookie, issueDemoMerchantPhoneCookie, verifyDemoMerchantCookie } from "@/lib/server/demo-access";

import { merchantPhoneAuth } from "@/lib/server/merchant-phone-auth";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";

const token = "a".repeat(32);
const basic = "Basic " + Buffer.from("preview:" + token).toString("base64");
function request(method = "POST", overrides: Record<string, string> = {}) {
  return new Request("http://127.0.0.1:3000/api/demo/orders", { method, headers: {
    host: "tea-preview.onrender.com", origin: "https://tea-preview.onrender.com",
    authorization: basic, "content-type": "application/json",
    "x-forwarded-proto": "https", "sec-fetch-site": "same-origin", ...overrides,
  } });
}
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DEMO_COMMERCE_CLOUD", "enabled");
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "");
  vi.stubEnv("DEMO_COMMERCE_LAN", "");
  vi.stubEnv("DEMO_CLOUD_ORIGIN", "https://tea-preview.onrender.com");
  vi.stubEnv("DEMO_PREVIEW_TOKEN_SHA256", createHash("sha256").update(token).digest("hex"));
  vi.stubEnv("DEMO_MERCHANT_SECRET", "b".repeat(64));
});
afterEach(() => vi.unstubAllEnvs());

describe("private synthetic cloud demo", () => {
  it("accepts an authenticated same-origin request behind HTTPS", () => {
    expect(() => assertLocalDemoHttpRequest(request(), "POST", "json")).not.toThrow();
  });
  it.each([
    { authorization: "" }, { authorization: "Basic " + Buffer.from("preview:" + "c".repeat(32)).toString("base64") },
    { origin: "" }, { origin: "null" }, { origin: "https://attacker.example" },
    { host: "attacker.example" }, { "x-forwarded-host": "attacker.example" },
    { "x-forwarded-proto": "http" }, { "x-forwarded-proto": "https,http" },
    { forwarded: "host=tea-preview.onrender.com;proto=https" },
    { "sec-fetch-site": "cross-site" }, { "sec-fetch-site": "none" },
  ])("rejects untrusted request headers %j", headers => {
    expect(() => assertCloudDemoRequest(request("POST", headers))).toThrow();
  });
  it("allows top-level authenticated page navigation but no cross-site GET", () => {
    expect(() => assertCloudDemoRequest(request("GET", { "sec-fetch-site": "none" }))).not.toThrow();
    expect(() => assertCloudDemoRequest(request("GET", { "sec-fetch-site": "cross-site" }))).toThrow();
    expect(() => assertCloudDemoRequest(request("GET", { "sec-fetch-site": "cross-site", "sec-fetch-mode": "navigate", "sec-fetch-dest": "document" }))).not.toThrow();
  });
  it("does not allow cloud via the client flag or local flag in production", () => {
    vi.stubEnv("DEMO_COMMERCE_CLOUD", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_COMMERCE", "enabled");
    vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled");
    expect(assertDemoEnabled).toThrow();
  });
  it.each(["DEMO_PREVIEW_TOKEN_SHA256", "DEMO_MERCHANT_SECRET"])("fails closed without %s", name => {
    vi.stubEnv(name, "");
    expect(assertDemoEnabled).toThrow();
  });
  it.each(["http://tea-preview.onrender.com", "https://attacker.example", "https://tea-preview.onrender.com/path", "https://tea-preview.onrender.com:444"])("rejects origin %s", origin => {
    vi.stubEnv("DEMO_CLOUD_ORIGIN", origin);
    expect(assertDemoEnabled).toThrow();
  });
  it("rejects mixed local/cloud configuration", () => {
    vi.stubEnv("DEMO_COMMERCE_LAN", "enabled");
    expect(assertDemoEnabled).toThrow();
  });
  it("rejects raw cloud credentials and issues expiring Secure cookies only after OTP", async () => {
    expect(issueDemoMerchantCookie(token)).toBeNull();
    expect(issueDemoMerchantCookie("b".repeat(64))).toBeNull();
    vi.stubEnv("DEMO_MERCHANT_PHONE", "0912000000");
    vi.stubEnv("DEMO_MERCHANT_PHONE_CONFIRMED", "yes");
    vi.stubEnv("DEMO_MERCHANT_SMS_MODE", "simulated");
    const challenge = await merchantPhoneAuth.issue("0912000000");
    const code = merchantPhoneAuth.takeForOperator(challenge.challengeId, "b".repeat(64))!;
    const cookie = issueDemoMerchantPhoneCookie("0912000000", challenge.challengeId, code)!;
    expect(cookie).toContain("__Host-demo_merchant=");
    expect(cookie).toContain("HttpOnly;");
    expect(cookie).toContain("Secure;");
    expect(cookie).toContain("SameSite=Strict;");
    expect(cookie).not.toContain(code);
    const issued = Number(cookie.match(/=(\d+)\./)![1]);
    expect(verifyDemoMerchantCookie(cookie, issued + 1)).toBe(true);
    expect(verifyDemoMerchantCookie(cookie, issued + 1_800_000)).toBe(false);
    expect(verifyDemoMerchantCookie(cookie.replace(String(issued) + ".", String(issued + 1) + "."), issued + 2)).toBe(false);
    expect(issueDemoMerchantPhoneCookie("0912000000", challenge.challengeId, code)).toBeNull();
  });
});

describe("private Acer HTTPS demo", () => {
  const acer = "https://tea-staging.home.arpa";
  const tokenValue = "a".repeat(32);
  const auth = "Basic " + Buffer.from("preview:" + tokenValue).toString("base64");
  function acerRequest(method = "POST", overrides: Record<string, string> = {}) {
    return new Request("http://tea-staging.home.arpa/api/demo/orders", { method, headers: { host: "tea-staging.home.arpa", origin: acer, authorization: auth, "content-type": "application/json", "x-forwarded-proto": "https", "sec-fetch-site": "same-origin", ...overrides } });
  }
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("DEMO_COMMERCE_CLOUD", ""); vi.stubEnv("DEMO_COMMERCE_ACER", "enabled"); vi.stubEnv("DEMO_COMMERCE_LOCAL", ""); vi.stubEnv("DEMO_COMMERCE_LAN", ""); vi.stubEnv("DEMO_ACER_ORIGIN", acer); vi.stubEnv("DEMO_PREVIEW_TOKEN_SHA256", createHash("sha256").update(tokenValue).digest("hex")); vi.stubEnv("DEMO_MERCHANT_SECRET", "b".repeat(64));
  });
  it("enables production demo only with explicit Acer mode and a single private HTTPS origin", () => { expect(acerDemoRequested()).toBe(true); expect(acerDemoOrigin().origin).toBe(acer); expect(() => assertDemoEnabled()).not.toThrow(); });
  it("accepts the explicit fully qualified private Tailscale DNS name", () => {
    vi.stubEnv("DEMO_ACER_ORIGIN", "https://acer-v5.tail4d8b5a.ts.net");
    expect(acerDemoOrigin().origin).toBe("https://acer-v5.tail4d8b5a.ts.net");
  });
  it.each(["http://tea-staging.home.arpa", "https://attacker.example", "https://x.tea-staging.home.arpa", "https://tea-staging.home.arpa:8443", "https://tea-staging.home.arpa/path"])("rejects unsafe Acer origin configuration %s", origin => { vi.stubEnv("DEMO_ACER_ORIGIN", origin); expect(() => acerDemoOrigin()).toThrow(); });
  it("accepts a public HTTPS origin only when DEMO_ACER_PUBLIC_HOST names that exact host", () => {
    const origin = "https://admin-104-199-148-195.sslip.io";
    vi.stubEnv("DEMO_ACER_ORIGIN", origin);
    vi.stubEnv("DEMO_ACER_PUBLIC_HOST", "");
    expect(() => acerDemoOrigin()).toThrow();
    vi.stubEnv("DEMO_ACER_PUBLIC_HOST", "other.sslip.io");
    expect(() => acerDemoOrigin()).toThrow();
    vi.stubEnv("DEMO_ACER_PUBLIC_HOST", "admin-104-199-148-195.sslip.io");
    expect(acerDemoOrigin().origin).toBe(origin);
    const request = new Request(`${origin.replace("https:", "http:")}/api/demo/otp`, {
      method: "POST",
      headers: { host: "admin-104-199-148-195.sslip.io", origin, authorization: auth, "content-type": "application/json",
        "x-forwarded-proto": "https", "sec-fetch-site": "same-origin" },
    });
    expect(() => assertAcerDemoRequest(request)).not.toThrow();
    expect(() => assertAcerDemoRequest(new Request(request, { headers: { ...Object.fromEntries(request.headers), origin: "https://attacker.example" } }))).toThrow();
  });
  it.each(["http://admin.example.com", "https://admin.example.com:8443", "https://admin.example.com/path", "https://user:pw@admin.example.com"])("rejects an opted-in public host with unsafe origin shape %s", origin => {
    vi.stubEnv("DEMO_ACER_PUBLIC_HOST", "admin.example.com");
    vi.stubEnv("DEMO_ACER_ORIGIN", origin);
    expect(() => acerDemoOrigin()).toThrow();
  });
  it("accepts only authenticated same-origin HTTPS traffic", () => { expect(() => assertAcerDemoRequest(acerRequest())).not.toThrow(); expect(() => assertAcerDemoRequest(acerRequest("POST", { origin: "https://attacker.example" }))).toThrow(); expect(() => assertAcerDemoRequest(acerRequest("POST", { host: "attacker.example" }))).toThrow(); expect(() => assertAcerDemoRequest(acerRequest("POST", { "x-forwarded-proto": "http" }))).toThrow(); expect(() => assertAcerDemoRequest(acerRequest("POST", { authorization: "" }))).toThrow(); expect(() => assertAcerDemoRequest(acerRequest("POST", { forwarded: "proto=https" }))).toThrow(); });
  it("accepts explicitly configured private HTTPS :8443 with exact Host and Origin", () => {
    const origin = "https://acer-v5.tail4d8b5a.ts.net:8443";
    vi.stubEnv("DEMO_ACER_ORIGIN", origin);
    expect(acerDemoOrigin().origin).toBe(origin);
    const request = new Request("http://acer-v5.tail4d8b5a.ts.net:8443/api/demo/otp", {
      method: "POST",
      headers: { host: "acer-v5.tail4d8b5a.ts.net:8443", origin,
        authorization: auth, "content-type": "application/json",
        "x-forwarded-proto": "https", "sec-fetch-site": "same-origin" },
    });
    expect(() => assertAcerDemoRequest(request)).not.toThrow();
  });
  it.each([
    "https://acer-v5.tail4d8b5a.ts.net:8444",
    "https://acer-v5.tail4d8b5a.ts.net:9443",
    "https://attacker.example:8443",
  ])("rejects unsafe configured custom origin %s", origin => {
    vi.stubEnv("DEMO_ACER_ORIGIN", origin);
    expect(() => acerDemoOrigin()).toThrow();
  });
  it("rejects :8443 requests with a mismatched port, Origin, or cross-site metadata", () => {
    const origin = "https://acer-v5.tail4d8b5a.ts.net:8443";
    vi.stubEnv("DEMO_ACER_ORIGIN", origin);
    const make = (overrides: Record<string, string> = {}) => new Request("http://acer-v5.tail4d8b5a.ts.net:8443/api/demo/otp", {
      method: "POST", headers: { host: "acer-v5.tail4d8b5a.ts.net:8443", origin,
        authorization: auth, "content-type": "application/json",
        "x-forwarded-proto": "https", "sec-fetch-site": "same-origin", ...overrides },
    });
    expect(() => assertAcerDemoRequest(make({ host: "acer-v5.tail4d8b5a.ts.net" }))).toThrow();
    expect(() => assertAcerDemoRequest(make({ origin: "https://acer-v5.tail4d8b5a.ts.net" }))).toThrow();
    expect(() => assertAcerDemoRequest(make({ origin: "https://attacker.example:8443" }))).toThrow();
    expect(() => assertAcerDemoRequest(make({ "sec-fetch-site": "cross-site" }))).toThrow();
  });
  it("allows the customer order API through direct Acer mode", () => {
    vi.stubEnv("DEMO_COMMERCE_ACER", "enabled");
    vi.stubEnv("DEMO_ACER_MERCHANT_LOGIN_DIRECT", "enabled");
    const requestFor = (path: string) => new NextRequest(`https://acer-v5.tail4d8b5a.ts.net${path}`, { method: "POST" });
    for (const path of ["/api/demo/otp", "/api/demo/orders", "/api/demo/orders/lookup"]) {
      expect(proxy(requestFor(path)).status, path).not.toBe(404);
    }
  });
});
