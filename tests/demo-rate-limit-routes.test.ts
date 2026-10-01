import { afterEach, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POST as lookup } from "@/app/api/demo/orders/lookup/route";
import { POST as otp } from "@/app/api/demo/otp/route";

vi.mock("@/lib/server/demo-runtime-singleton", () => ({
  getLocalDemoRuntime: () => ({
    lookupOrder: () => { throw new Error("No matching order"); },
    issueLookupOtp: () => ({ challengeId: "opaque", expiresAt: 999999999, delivery: "simulated" }),
    issueOtp: () => ({ challengeId: "test-challenge", expiresAt: 999999999 }),
  }),
}));
const folders: string[] = [];
function setup() {
  const directory = mkdtempSync(join(tmpdir(), "demo-rate-route-"));
  folders.push(directory);
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled");
  vi.stubEnv("DEMO_DATA_DIR", directory);
}
function req(path: string, body: unknown) {
  return new Request("http://127.0.0.1:3013" + path, {
    method: "POST",
    headers: { host: "127.0.0.1:3013", origin: "http://127.0.0.1:3013", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
afterEach(() => { vi.unstubAllEnvs(); for (const folder of folders.splice(0)) rmSync(folder, {recursive:true, force:true}); });

it("rejects lookup attempt six with 429, generic error, and retry-after", async () => {
  setup();
  const body = { orderId: "DEMO-unknown", phone: "0912000000" };
  for (let i = 0; i < 5; i++) expect((await lookup(req("/api/demo/orders/lookup", body))).status).toBe(403);
  const blocked = await lookup(req("/api/demo/orders/lookup", body));
  expect(blocked.status).toBe(429);
  expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
  expect(await blocked.json()).toMatchObject({ok:false, error:"嘗試次數過多，請稍後再試。"});
});

it("rejects fourth OTP issue without exposing the demo code", async () => {
  setup();
  const body = { phone: "0912000000", purpose: "lookup" };
  for (let i = 0; i < 3; i++) expect((await otp(req("/api/demo/otp", body))).status).toBe(200);
  const blocked = await otp(req("/api/demo/otp", body));
  expect(blocked.status).toBe(429);
  expect(await blocked.json()).toMatchObject({ok:false, error:"嘗試次數過多，請稍後再試。"});
});

it("cross-device OTP has no phone/secret and blocks fourth issue generically", async () => {
  setup(); const body = { purpose: "lookup", orderId: "261002-001", customerName: "Test", phoneLastThree: "000" };
  for (let i = 0; i < 3; i++) {
    const response = await otp(req("/api/demo/otp", body)); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, value: { challengeId: "opaque", delivery: "simulated" } });
  }
  const blocked = await otp(req("/api/demo/otp", body)); expect(blocked.status).toBe(429);
  expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
  expect(JSON.stringify(await blocked.json())).not.toContain("123456");
});
it("cross-device order quota survives changing the name and suffix", async () => {
  setup();
  for (let i = 0; i < 5; i++) expect((await lookup(req("/api/demo/orders/lookup", {
    orderId: "261002-001", customerName: "Name" + i, phoneLastThree: String(i).padStart(3, "0")
  }))).status).toBe(403);
  const blocked = await lookup(req("/api/demo/orders/lookup", { orderId: "261002-001", customerName: "Other", phoneLastThree: "999" }));
  expect(blocked.status).toBe(429);
});
