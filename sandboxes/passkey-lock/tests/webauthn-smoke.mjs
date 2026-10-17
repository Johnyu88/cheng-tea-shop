import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { chromium, expect, request } from "@playwright/test";

const required = ["SANDBOX_TEST_BASE_URL", "SANDBOX_ACCESS_PASSWORD", "SANDBOX_BOOTSTRAP_EMAIL", "SANDBOX_BOOTSTRAP_PASSWORD"];
for (const key of required) if (!process.env[key]) throw new Error("Missing sandbox test configuration: " + key);
const baseURL = process.env.SANDBOX_TEST_BASE_URL;
assert.equal(new URL(baseURL).origin, "http://localhost:3142", "Virtual authenticator smoke targets the isolated local sandbox only");
const secrets = [process.env.SANDBOX_ACCESS_PASSWORD, process.env.SANDBOX_BOOTSTRAP_PASSWORD];
const expectedMerchant = process.env.SANDBOX_TEST_EXPECT_MERCHANT_ALLOWED !== "no";
const bootstrapEmail = process.env.SANDBOX_BOOTSTRAP_EMAIL;
const credentials = { username: "sandbox", password: process.env.SANDBOX_ACCESS_PASSWORD };
const browser = await chromium.launch();
const passed = label => console.log("PASS: " + label);
try {
  const publicApi = await request.newContext({ baseURL });
  assert.equal((await publicApi.get("/api/merchant-session")).status(), 401, "Basic gate must protect the sandbox");
  await publicApi.dispose();
  passed("private sandbox Basic gate");
  const context = await browser.newContext({ baseURL, httpCredentials: credentials, viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", { options: {
    protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true,
    isUserVerified: true, automaticPresenceSimulation: true,
  } });
  const session = async () => {
    const response = await page.request.get("/api/merchant-session");
    assert.equal(response.ok(), true, "Sandbox session endpoint must respond");
    return response.json();
  };
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Passkey 鎖頭沙盒", exact: true })).toBeVisible();
  assert.equal((await session()).authenticated, false);
  assert.equal((await session()).merchantAllowed, false);
  passed("anonymous merchant bridge denied");
  await page.getByLabel("沙盒帳號", { exact: true }).fill(bootstrapEmail);
  await page.getByLabel("初次設定密碼", { exact: true }).fill(process.env.SANDBOX_BOOTSTRAP_PASSWORD);
  await page.getByRole("button", { name: "初次設定登入", exact: true }).click();
  await expect.poll(async () => (await session()).authenticated).toBe(true);
  assert.equal((await session()).merchantAllowed, expectedMerchant);
  passed("vendor bootstrap account login with merchant permission " + expectedMerchant);
  const bridgeWrite = await page.request.post("/api/merchant-session", { headers: { origin: baseURL }, data: {} });
  assert.equal(bridgeWrite.status(), 405, "Sandbox bridge is read-only");
  passed("merchant bridge cannot mutate tea business data");
  const wrongOrigin = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "https://attacker.example" },
    data: { email: bootstrapEmail, password: process.env.SANDBOX_BOOTSTRAP_PASSWORD },
  });
  assert.equal(wrongOrigin.status(), 403, "Vendor must reject an untrusted Origin");
  passed("wrong Origin rejected");
  const blockedSignup = await page.request.post("/api/auth/sign-up/email", {
    headers: { origin: baseURL }, data: { email: "uninvited@example.test", name: "Uninvited", password: "synthetic-never-published-password" },
  });
  assert.equal(blockedSignup.ok(), false, "Public account signup must be disabled");
  passed("public signup disabled");
  await page.getByRole("button", { name: "註冊手機 Passkey", exact: true }).click();
  await expect.poll(async () => (await cdp.send("WebAuthn.getCredentials", { authenticatorId })).credentials.length).toBe(1);
  passed("vendor Passkey registration using virtual CTAP2 authenticator");
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(cookie => /session_token/.test(cookie.name));
  assert.ok(sessionCookie, "Vendor must issue a signed session cookie");
  secrets.push(sessionCookie.value, decodeURIComponent(sessionCookie.value));
  const tampered = cookies.map(cookie => cookie.name + "=" + (cookie.name === sessionCookie.name ? "tampered-" + cookie.value : cookie.value)).join("; ");
  const invalidCookieResponse = await page.request.get("/api/merchant-session", { headers: { cookie: tampered } });
  const invalidCookieSession = await invalidCookieResponse.json();
  assert.equal(invalidCookieSession.authenticated, false);
  assert.equal(invalidCookieSession.merchantAllowed, false);
  passed("modified session cookie cannot grant merchant access");
  await page.getByRole("button", { name: "登出", exact: true }).click();
  await expect.poll(async () => (await session()).authenticated).toBe(false);
  const vendorSession = await page.request.get("/api/auth/get-session");
  assert.equal((await vendorSession.json()) === null, true, "Vendor logout must remove the session");
  passed("vendor logout clears session");
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.getByRole("button", { name: "使用 Passkey 登入", exact: true }).click();
    await expect.poll(async () => (await session()).authenticated).toBe(true);
    assert.equal((await session()).merchantAllowed, expectedMerchant);
    passed("Passkey login round " + attempt);
    await page.getByRole("button", { name: "登出", exact: true }).click();
    await expect.poll(async () => (await session()).authenticated).toBe(false);
  }
  const originalCredential = (await cdp.send("WebAuthn.getCredentials", { authenticatorId })).credentials[0];
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const wrongKey = privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
  secrets.push(wrongKey);
  await cdp.send("WebAuthn.removeCredential", { authenticatorId, credentialId: originalCredential.credentialId });
  await cdp.send("WebAuthn.addCredential", { authenticatorId, credential: {
    credentialId: originalCredential.credentialId, isResidentCredential: originalCredential.isResidentCredential,
    rpId: originalCredential.rpId, privateKey: wrongKey, userHandle: originalCredential.userHandle,
    signCount: originalCredential.signCount,
  } });
  const invalidAssertionResponse = page.waitForResponse(response => response.url().includes("/passkey/verify-authentication"));
  await page.getByRole("button", { name: "使用 Passkey 登入", exact: true }).click();
  assert.equal((await invalidAssertionResponse).ok(), false, "A credential signed by the wrong private key must be rejected");
  await expect(page.locator("p[role=alert]")).toBeVisible();
  assert.equal((await session()).authenticated, false);
  passed("invalid authenticator signature rejected");
  await cdp.send("WebAuthn.clearCredentials", { authenticatorId });

  await page.getByRole("button", { name: "使用 Passkey 登入", exact: true }).click();
  await expect(page.locator("p[role=alert]")).toBeVisible();
  assert.equal((await session()).authenticated, false);
  assert.equal((await session()).merchantAllowed, false);
  passed("missing authenticator credential rejected");
  await cdp.send("WebAuthn.removeVirtualAuthenticator", { authenticatorId });
  await context.close();
  console.log("Sandbox virtual WebAuthn smoke passed. This verifies CDP virtual CTAP2, not physical Face ID or fingerprint hardware.");
} catch (error) {
  let message = String(error instanceof Error ? error.message : "Sandbox test failed");
  for (const secret of secrets) message = message.split(secret).join("[redacted]");
  console.error(message); process.exitCode = 1;
} finally { await browser.close(); }
