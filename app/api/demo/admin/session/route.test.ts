import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";

const origin = "https://acer-v5.tail4d8b5a.ts.net";
const token = "abcdef0123456789abcdef0123456789";

vi.mock("@/lib/server/merchant-passkey", () => ({ getMerchantPasskeyStore: () => null }));

function logoutRequest(overrides: Record<string, string> = {}) {
  const headers = new Headers({
    host: new URL(origin).host,
    origin,
    authorization: "Basic " + Buffer.from("preview:" + token).toString("base64"),
    "x-forwarded-proto": "https",
    ...overrides,
  });
  return new Request(origin + "/api/demo/admin/session", { method: "DELETE", headers });
}

describe("AUTH-02 Demo merchant logout", () => {
  beforeEach(() => {
    vi.stubEnv("DEMO_COMMERCE_ACER", "enabled");
    vi.stubEnv("DEMO_COMMERCE_CLOUD", "");
    vi.stubEnv("DEMO_COMMERCE_LOCAL", "");
    vi.stubEnv("DEMO_COMMERCE_LAN", "");
    vi.stubEnv("DEMO_ACER_ORIGIN", origin);
    vi.stubEnv("DEMO_PREVIEW_TOKEN_SHA256", createHash("sha256").update(token).digest("hex"));
    vi.stubEnv("DEMO_MERCHANT_SECRET", "22".repeat(32));
  });

  afterEach(() => vi.unstubAllEnvs());

  it("accepts a same-origin HTTPS DELETE without a body and expires Demo cookies", async () => {
    const request = logoutRequest();
    expect(() => assertLocalDemoHttpRequest(request, "DELETE")).not.toThrow();
    const response = await DELETE(request);
    expect(response.status, await response.clone().text()).toBe(200);
    expect(await response.json()).toEqual({ ok: true, value: { authenticated: false } });
    expect(response.headers.getSetCookie().some(cookie =>
      cookie.startsWith("__Host-demo_merchant=") && cookie.includes("Max-Age=0"),
    )).toBe(true);
  });

  it.each([
    ["untrusted Origin", { origin: "https://attacker.invalid" }],
    ["mismatched Host", { host: "attacker.invalid" }],
    ["insecure proxy protocol", { "x-forwarded-proto": "http" }],
  ])("continues to reject %s", async (_reason, headers) => {
    const response = await DELETE(logoutRequest(headers));
    expect(response.status).toBe(403);
  });
});
