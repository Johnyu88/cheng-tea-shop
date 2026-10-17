import { chromium, expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const externalBase = process.env.DEMO_BASE_URL;
const localAuth02 = process.env.DEMO_AUTH02_LOCAL === "enabled";
const baseURL = externalBase ?? (localAuth02 ? "http://127.0.0.1:3014" : "http://127.0.0.1:3013");
const operatorSecret = "11".repeat(32);

async function login(page: Page) {
  if (externalBase) {
    const password = process.env.DEMO_MERCHANT_PASSWORD;
    if (!password) throw new Error("DEMO_MERCHANT_PASSWORD is required for the external Acer run");
    const response = await page.request.post("/api/demo/admin/session", { headers: { origin: new URL(baseURL).origin }, data: { password } });
    expect(response.status()).toBe(200);
    return;
  }
  if (localAuth02) {
    const response = await page.request.post("/api/demo/admin/session", { headers: { origin: new URL(baseURL).origin }, data: { credential: operatorSecret } });
    expect(response.status()).toBe(200);
    return;
  }

  const origin = new URL(baseURL).origin;
  const challengeResponse = await page.request.post("/api/demo/admin/otp", {
    headers: { origin },
    data: { phone: "0912000000" },
  });
  expect(challengeResponse.status()).toBe(200);
  const challenge = (await challengeResponse.json()).value;
  const operatorResponse = await page.request.post("/api/demo/admin/otp/operator", {
    headers: { origin, "x-demo-merchant-operator": operatorSecret },
    data: { challengeId: challenge.challengeId },
  });
  expect(operatorResponse.status()).toBe(200);
  const code = (await operatorResponse.json()).value.code;
  const loginResponse = await page.request.post("/api/demo/admin/session", {
    headers: { origin },
    data: { phone: "0912000000", challengeId: challenge.challengeId, code },
  });
  expect(loginResponse.status()).toBe(200);
}

test("AUTH-02 logout revokes Demo access without affecting orders", async () => {
  if (!externalBase && !localAuth02) test.skip();
  const externalCredentials = externalBase ? {
    username: process.env.DEMO_BASIC_AUTH_USERNAME ?? "",
    password: process.env.DEMO_BASIC_AUTH_PASSWORD ?? "",
  } : undefined;
  if (externalBase && (!externalCredentials?.username || !externalCredentials.password)) {
    throw new Error("DEMO_BASIC_AUTH_USERNAME and DEMO_BASIC_AUTH_PASSWORD are required for Acer");
  }

  const browser = await chromium.launch(process.env.DEMO_PLAYWRIGHT_CHANNEL ? { channel: process.env.DEMO_PLAYWRIGHT_CHANNEL } : {});
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    ...(externalCredentials ? { httpCredentials: externalCredentials } : {}),
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await login(page);

    const before = await page.evaluate(async () => {
      const session = await (await fetch("/api/demo/admin/session")).json();
      const orders = await (await fetch("/api/demo/admin/orders")).json();
      return { session: session.value, orders: orders.value };
    });
    expect(before.session.authenticated).toBe(true);
    expect(Array.isArray(before.orders)).toBe(true);
    const orderIdsBefore = before.orders.map((entry: { order: { orderId: string } }) => entry.order.orderId).sort();
    if (externalBase) {
      expect(orderIdsBefore.length).toBeGreaterThan(0);
      expect(before.session.passkey.enabled).toBe(true);
      expect(before.session.passkey.registered).toBe(true);
    }

    const cookiesBefore = await context.cookies();
    expect(cookiesBefore.some(cookie => /demo_merchant/.test(cookie.name))).toBe(true);

    let logoutRequest: { method: string; postData: string | null; headers: Record<string, string> } | undefined;
    page.on("request", request => {
      if (request.url().endsWith("/api/demo/admin/session") && request.method() === "DELETE") {
        logoutRequest = { method: request.method(), postData: request.postData(), headers: request.headers() };
      }
    });
    const logout = await page.evaluate(async () => {
      const response = await fetch("/api/demo/admin/session", { method: "DELETE" });
      return { status: response.status, body: await response.json() };
    });
    expect(logout.status).toBe(200);
    expect(logout.body.value.authenticated).toBe(false);
    expect(logoutRequest?.method).toBe("DELETE");
    expect(logoutRequest?.postData).toBeNull();
    expect(logoutRequest?.headers["content-type"]).toBeUndefined();

    const cookiesAfter = await context.cookies();
    expect(cookiesAfter.some(cookie => /demo_merchant/.test(cookie.name))).toBe(false);

    await page.goto("/admin/orders");
    const afterLogout = await page.evaluate(async () => {
      const session = await (await fetch("/api/demo/admin/session")).json();
      const ordersResponse = await fetch("/api/demo/admin/orders");
      const orders = await ordersResponse.json();
      return { session: session.value, ordersStatus: ordersResponse.status, orders: orders.value };
    });
    expect(afterLogout.session.authenticated).toBe(false);
    expect(
      afterLogout.ordersStatus === 401
      || afterLogout.ordersStatus === 403
      || (Array.isArray(afterLogout.orders) && afterLogout.orders.length === 0),
    ).toBe(true);
    await expect(page.locator(".demo-order-card")).toHaveCount(0);
    if (externalBase) {
      await expect(page.locator('section[aria-label*="Passkey"] button').first()).toBeVisible();
      expect(afterLogout.session.passkey.registered).toBe(true);
    }

    await login(page);
    const afterRelogin = await page.evaluate(async () => {
      const session = await (await fetch("/api/demo/admin/session")).json();
      const orders = await (await fetch("/api/demo/admin/orders")).json();
      return { session: session.value, orders: orders.value };
    });
    expect(afterRelogin.session.authenticated).toBe(true);
    const orderIdsAfter = afterRelogin.orders.map((entry: { order: { orderId: string } }) => entry.order.orderId).sort();
    expect(orderIdsAfter).toEqual(orderIdsBefore);
    if (externalBase) expect(afterRelogin.session.passkey.registered).toBe(true);
  } finally {
    await context.close();
    await browser.close();
  }
});
