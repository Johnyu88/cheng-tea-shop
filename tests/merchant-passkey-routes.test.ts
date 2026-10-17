import { afterEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { POST as enroll } from "@/app/api/demo/admin/passkey/enroll/route";
import { GET as status, DELETE as logout } from "@/app/api/demo/admin/session/route";
import { POST as vendorPost } from "@/app/api/auth/[...all]/route";
import { issueDemoMerchantCookie } from "@/lib/server/demo-access";
import { getMerchantPasskeyStore } from "@/lib/server/merchant-passkey";
const folders: string[] = [];
afterEach(() => { getMerchantPasskeyStore()?.close(); vi.unstubAllEnvs(); folders.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });
function setup() {
  const directory = mkdtempSync(join(tmpdir(), "merchant-passkey-route-")); folders.push(directory);
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled"); vi.stubEnv("DEMO_MERCHANT_SECRET", "a".repeat(64)); vi.stubEnv("DEMO_DATA_DIR", directory);
  vi.stubEnv("DEMO_PASSKEY_LOCAL_ORIGIN", "http://localhost:3143"); vi.stubEnv("DEMO_AUTH_PROVIDER", "");
}
function req(path: string, method: string, cookie = "", origin = "http://localhost:3143", body = {}) {
  return new Request("http://localhost:3143" + path, { method,
    headers: { host: "localhost:3143", origin, cookie, "content-type": "application/json" },
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }) });
}
test("anonymous and cross-origin enrollment denied; fallback-gated vendor setup does not issue fallback cookie", async () => {
  setup();
  expect((await enroll(req("/api/demo/admin/passkey/enroll", "POST"))).status).toBe(403);
  const fallback = issueDemoMerchantCookie("a".repeat(64))!.split(";")[0]!;
  expect((await enroll(req("/api/demo/admin/passkey/enroll", "POST", fallback, "https://attacker.invalid"))).status).toBe(403);
  const response = await enroll(req("/api/demo/admin/passkey/enroll", "POST", fallback));
  expect(response.status).toBe(200);
  const setCookies = response.headers.getSetCookie(); expect(setCookies.some(s => s.startsWith("__Host-demo_merchant="))).toBe(false);
  const cookie = setCookies.map(s => s.split(";")[0]).join("; ");
  expect(await (await status(req("/api/demo/admin/session", "GET", cookie))).json()).toMatchObject({ value: { authenticated: true, passkey: { enabled: true, registered: false } } });
  expect((await logout(req("/api/demo/admin/session", "DELETE", cookie))).status).toBe(200);
  expect(await (await status(req("/api/demo/admin/session", "GET", cookie))).json()).toMatchObject({ value: { authenticated: false } });
});
test("public signup/password signin blocked and anonymous registration denied", async () => {
  setup();
  for (const path of ["/sign-up/email", "/sign-in/email"]) expect((await vendorPost(req("/api/auth" + path, "POST"))).status).toBe(404);
  expect((await vendorPost(req("/api/auth/passkey/verify-registration", "POST"))).status).toBe(403);
});

