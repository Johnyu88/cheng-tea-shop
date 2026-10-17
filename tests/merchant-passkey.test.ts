import { afterEach, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMerchantPasskeyStore } from "@/lib/server/merchant-passkey";
const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })));
test("vendor session authorizes only the persisted merchant user, logout revokes it", async () => {
  const directory = mkdtempSync(join(tmpdir(), "merchant-passkey-")); dirs.push(directory);
  const store = createMerchantPasskeyStore({ origin: "http://localhost:3143", directory, secret: "a".repeat(64) });
  try {
    await store.prepare();
    expect(await store.authorized(new Headers())).toBe(false);
    const response = await store.enroll();
    const cookies = response.headers.getSetCookie().map(s => s.split(";")[0]).join("; ");
    const headers = new Headers({ cookie: cookies });
    expect(await store.authorized(headers)).toBe(true);
    expect(await store.status()).toEqual({ enabled: true, registered: false });
    await store.auth.api.signOut({ headers });
    expect(await store.authorized(headers)).toBe(false);
  } finally { store.close(); }
});
test("public signup is disabled and another vendor user session cannot authorize", async () => {
  const directory = mkdtempSync(join(tmpdir(), "merchant-passkey-")); dirs.push(directory);
  const store = createMerchantPasskeyStore({ origin: "http://localhost:3143", directory, secret: "b".repeat(64) });
  try {
    await store.prepare();
    await expect(store.auth.api.signUpEmail({ body: { email: "other@example.invalid", password: "not-a-real-password", name: "Other" } })).rejects.toThrow();
    expect(await store.authorized(new Headers({ cookie: "tea-merchant.session_token=forged" }))).toBe(false);
  } finally { store.close(); }
});


test("genuine vendor session for a different user stays outside merchant allowlist", async () => {
  const directory = mkdtempSync(join(tmpdir(), "merchant-passkey-")); dirs.push(directory);
  const store = createMerchantPasskeyStore({ origin: "http://localhost:3143", directory, secret: "c".repeat(64) });
  try {
    await store.prepare();
    const context = await store.auth.$context;
    const user = await context.internalAdapter.createUser({ email: "outsider@example.invalid", name: "Other", emailVerified: false }, { method: "email-password" });
    await context.internalAdapter.linkAccount({ userId: user.id, providerId: "credential", accountId: user.id, password: await context.password.hash("test-only-password") });
    const response = await store.auth.api.signInEmail({ body: { email: user.email, password: "test-only-password" }, asResponse: true });
    const headers = new Headers({ cookie: response.headers.getSetCookie().map(s => s.split(";")[0]).join("; ") });
    expect(await store.auth.api.getSession({ headers })).not.toBeNull();
    expect(await store.authorized(headers)).toBe(false);
  } finally { store.close(); }
});
test("vendor database and allowlisted user binding survive additive startup", async () => {
  const directory = mkdtempSync(join(tmpdir(), "merchant-passkey-")); dirs.push(directory);
  const options = { origin: "http://localhost:3143", directory, secret: "d".repeat(64) };
  const first = createMerchantPasskeyStore(options); await first.prepare(); const response = await first.enroll();
  const headers = new Headers({ cookie: response.headers.getSetCookie().map(s => s.split(";")[0]).join("; ") });
  first.close(); const reopened = createMerchantPasskeyStore(options); try {
    await reopened.prepare(); expect(await reopened.authorized(headers)).toBe(true);
  } finally { reopened.close(); }
});
