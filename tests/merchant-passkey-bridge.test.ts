import { afterEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GET as listOrders } from "@/app/api/demo/admin/orders/route";
import { DELETE as logout } from "@/app/api/demo/admin/session/route";
import { getMerchantPasskeyStore } from "@/lib/server/merchant-passkey";

const origin = "http://localhost:3143";
const secret = "e".repeat(64);
const directories: string[] = [];

afterEach(() => {
  const runtimeGlobal = globalThis as typeof globalThis & { __chengTeaDemoRuntime?: { close(): void } };
  runtimeGlobal.__chengTeaDemoRuntime?.close();
  delete runtimeGlobal.__chengTeaDemoRuntime;
  getMerchantPasskeyStore()?.close();
  vi.unstubAllEnvs();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function setup() {
  const directory = mkdtempSync(join(tmpdir(), "merchant-passkey-bridge-"));
  directories.push(directory);
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled");
  vi.stubEnv("DEMO_COMMERCE_CLOUD", "");
  vi.stubEnv("DEMO_DATA_DIR", directory);
  vi.stubEnv("DEMO_MERCHANT_SECRET", secret);
  vi.stubEnv("DEMO_PASSKEY_LOCAL_ORIGIN", origin);
  vi.stubEnv("DEMO_AUTH_PROVIDER", "");
  return getMerchantPasskeyStore()!;
}

function request(path: string, method = "GET", cookie = "", requestOrigin = origin, crossSite = false) {
  return new Request(origin + path, {
    method,
    headers: {
      host: "localhost:3143",
      origin: requestOrigin,
      cookie,
      "sec-fetch-site": crossSite ? "cross-site" : "same-origin",
      ...(method === "GET" ? {} : { "content-type": "application/json" }),
    },
  });
}

function sessionCookie(response: Response) {
  return response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}

test("real allowlisted Better Auth vendor session reaches merchant order listing through the bridge", async () => {
  const store = setup();
  const vendorSession = sessionCookie(await store.enroll());

  const response = await listOrders(request("/api/demo/admin/orders", "GET", vendorSession));

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ ok: true, value: expect.any(Array) });
});

test("anonymous, forged, and genuine non-merchant vendor sessions cannot list orders", async () => {
  const store = setup();
  await store.prepare();
  const outsider = await (await store.auth.$context).internalAdapter.createUser(
    { email: "outsider@example.invalid", name: "Outsider", emailVerified: false },
    { method: "email-password" },
  );
  await (await store.auth.$context).internalAdapter.linkAccount({
    userId: outsider.id,
    providerId: "credential",
    accountId: outsider.id,
    password: await (await store.auth.$context).password.hash("test-only-password"),
  });
  const outsiderResponse = await store.auth.api.signInEmail({
    body: { email: outsider.email, password: "test-only-password" },
    asResponse: true,
  });

  for (const cookie of ["", "tea-merchant.session_token=forged", sessionCookie(outsiderResponse)]) {
    expect((await listOrders(request("/api/demo/admin/orders", "GET", cookie))).status).toBe(403);
  }
});

test("logout revokes the real vendor session before the next bridged order request", async () => {
  const store = setup();
  const vendorSession = sessionCookie(await store.enroll());
  expect((await listOrders(request("/api/demo/admin/orders", "GET", vendorSession))).status).toBe(200);

  const signout = await logout(request("/api/demo/admin/session", "DELETE", vendorSession));

  expect(signout.status).toBe(200);
  expect((await listOrders(request("/api/demo/admin/orders", "GET", vendorSession))).status).toBe(403);
});

test("cross-origin bridge requests are denied by the existing local HTTP guard", async () => {
  const store = setup();
  const vendorSession = sessionCookie(await store.enroll());

  const response = await listOrders(request(
    "/api/demo/admin/orders",
    "GET",
    vendorSession,
    "https://attacker.invalid",
    true,
  ));

  expect(response.status).toBe(403);
});
