import { createHash, randomBytes } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DELETE, GET, POST } from "@/app/api/demo/admin/session/route";
import { verifyDemoMerchantCookie } from "@/lib/server/demo-access";
import { getMerchantPasskeyStore } from "@/lib/server/merchant-passkey";
import { createDemoSessionRevocationStore } from "@/lib/server/demo-session-revocation";

const origin = "https://acer-v5.tail4d8b5a.ts.net:8443";
const host = "acer-v5.tail4d8b5a.ts.net:8443";
const password = "candidate-test-password-2026";
const previewToken = randomBytes(20).toString("hex");
const merchantSecret = randomBytes(32).toString("hex");
let directory = "";
const cookieHeaders = () => ({
  host,
  origin,
  "x-forwarded-proto": "https",
  "sec-fetch-site": "same-origin",
  "content-type": "application/json",
  authorization: "Basic " + Buffer.from("preview:" + previewToken).toString("base64"),
});
const sessionValue = async (response: Response) => (await response.json() as { value: { authenticated: boolean } }).value;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "tea-session-route-"));
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DEMO_COMMERCE_CLOUD", "");
  vi.stubEnv("DEMO_COMMERCE_ACER", "enabled");
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "");
  vi.stubEnv("DEMO_COMMERCE_LAN", "");
  vi.stubEnv("DEMO_ACER_ORIGIN", origin);
  vi.stubEnv("DEMO_AUTH_ENV", "acer-demo");
  vi.stubEnv("DEMO_AUTH_PROVIDER", "password");
  vi.stubEnv("DEMO_AUTH_PASSWORD", password);
  vi.stubEnv("DEMO_PREVIEW_TOKEN_SHA256", createHash("sha256").update(previewToken).digest("hex"));
  vi.stubEnv("DEMO_MERCHANT_SECRET", merchantSecret);
  vi.stubEnv("DEMO_DATA_DIR", directory);
});
afterEach(async () => {
  getMerchantPasskeyStore()?.close();
  vi.unstubAllEnvs();
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = "";
});

async function login() {
  const response = await POST(new Request(origin + "/api/demo/admin/session", {
    method: "POST",
    headers: cookieHeaders(),
    body: JSON.stringify({ password }),
  }));
  expect(response.status).toBe(200);
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();
  const cookie = setCookie!.split(";")[0]!;
  return { response, cookie };
}

test("logout revokes the old cookie across connections and a store reopen", async () => {
  await new Promise(resolve => setTimeout(resolve, 1_100));
  const { cookie } = await login();
  expect(verifyDemoMerchantCookie(cookie)).toBe(true);

  const before = await GET(new Request(origin + "/api/demo/admin/session", {
    headers: { ...cookieHeaders(), cookie },
  }));
  expect((await sessionValue(before)).authenticated).toBe(true);

  const logout = await DELETE(new Request(origin + "/api/demo/admin/session", {
    method: "DELETE",
    headers: { ...cookieHeaders(), cookie },
  }));
  expect(logout.status).toBe(200);
  expect(logout.headers.get("set-cookie")).toMatch(/Max-Age=0/i);
  expect(verifyDemoMerchantCookie(cookie)).toBe(false);

  const databasePath = join(directory, "merchant-auth.sqlite");
  const firstReopen = createDemoSessionRevocationStore(databasePath);
  const signature = cookie.split(".").at(-1)!;
  const signatureHash = createHash("sha256").update(signature).digest("hex");
  expect(firstReopen.isRevoked(signatureHash)).toBe(true);
  firstReopen.close();
  const afterRestart = createDemoSessionRevocationStore(databasePath);
  expect(afterRestart.isRevoked(signatureHash)).toBe(true);
  afterRestart.close();

  const replay = await GET(new Request(origin + "/api/demo/admin/session", {
    headers: { ...cookieHeaders(), cookie },
  }));
  expect((await sessionValue(replay)).authenticated).toBe(false);
});

test("logout fails closed when the persistent revocation database cannot be written", async () => {
  await new Promise(resolve => setTimeout(resolve, 1_100));
  const { cookie } = await login();
  const originalDirectory = directory;
  const invalidDirectory = join(tmpdir(), "tea-session-db-parent-file-" + randomBytes(8).toString("hex"));
  await writeFile(invalidDirectory, "not a directory");
  vi.stubEnv("DEMO_DATA_DIR", invalidDirectory);

  const logout = await DELETE(new Request(origin + "/api/demo/admin/session", {
    method: "DELETE",
    headers: { ...cookieHeaders(), cookie },
  }));
  expect(logout.status).toBe(403);
  expect(logout.headers.get("set-cookie") ?? "").not.toMatch(/Max-Age=0/i);
  expect(verifyDemoMerchantCookie(cookie)).toBe(false);

  vi.stubEnv("DEMO_DATA_DIR", originalDirectory);
  expect(verifyDemoMerchantCookie(cookie)).toBe(true);
  await rm(invalidDirectory, { force: true });
});
