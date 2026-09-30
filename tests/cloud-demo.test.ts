import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { assertDemoEnabled, assertCloudDemoRequest } from "@/lib/server/demo-cloud";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { issueDemoMerchantCookie, verifyDemoMerchantCookie } from "@/lib/server/demo-access";

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
  it("requires independent merchant credentials and issues expiring Secure cookies", () => {
    expect(issueDemoMerchantCookie(token, 1000)).toBeNull();
    const cookie = issueDemoMerchantCookie("b".repeat(64), 1000)!;
    expect(cookie).toContain("__Host-demo_merchant=");
    expect(cookie).toContain("HttpOnly;");
    expect(cookie).toContain("Secure;");
    expect(cookie).toContain("SameSite=Strict;");
    expect(verifyDemoMerchantCookie(cookie, 1001)).toBe(true);
    expect(verifyDemoMerchantCookie(cookie, 1_801_000)).toBe(false);
    expect(verifyDemoMerchantCookie(cookie.replace("1000.", "1001."), 1002)).toBe(false);
  });
});
