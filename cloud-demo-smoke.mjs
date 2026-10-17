import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "tea-cloud-smoke-"));
const token = randomBytes(16).toString("hex");
const merchant = randomBytes(32).toString("hex");
const authProvider = process.env.DEMO_SMOKE_AUTH_PROVIDER ?? "password";
assert.ok(["password", "sms"].includes(authProvider));
const password = process.env.DEMO_SMOKE_PASSWORD ?? randomBytes(24).toString("hex");
const origin = "https://cheng-tea-password-demo.onrender.com";
const base = "http://127.0.0.1:3138";
const child = spawn(process.execPath, ["scripts/start-playwright-standalone.mjs"], {
  stdio: ["ignore", "inherit", "inherit"],
  env: { ...process.env, PORT: "3138", HOSTNAME: "127.0.0.1", NODE_ENV: "production",
    NEXT_PUBLIC_DEMO_COMMERCE: "enabled", DEMO_COMMERCE_CLOUD: "enabled",
    DEMO_COMMERCE_LOCAL: "", DEMO_COMMERCE_LAN: "", DEMO_CLOUD_ORIGIN: origin,
    DEMO_PREVIEW_TOKEN_SHA256: createHash("sha256").update(token).digest("hex"),
    DEMO_AUTH_PROVIDER: authProvider, DEMO_AUTH_ENV: authProvider === "password" ? "isolated-demo" : "", DEMO_AUTH_PASSWORD: authProvider === "password" ? password : "",
    DEMO_MERCHANT_SECRET: merchant, DEMO_DATA_DIR: directory, DEMO_MERCHANT_PHONE: "0912000000", DEMO_MERCHANT_PHONE_CONFIRMED: "yes", DEMO_MERCHANT_SMS_MODE: "simulated" },
});
const headers = { host: "cheng-tea-password-demo.onrender.com", "x-forwarded-proto": "https",
  authorization: "Basic " + Buffer.from("preview:" + token).toString("base64") };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function call(path, init = {}) {
  // Native http preserves the canonical Host; Node fetch intentionally overwrites it.
  const request = new Request(base + path, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const body = request.body ? Buffer.from(await request.arrayBuffer()) : undefined;
  return new Promise((resolve, reject) => {
    const outgoing = http.request(base + path, { method: request.method, headers: Object.fromEntries(request.headers) }, incoming => {
      const chunks = [];
      incoming.on("data", chunk => chunks.push(chunk));
      incoming.on("end", () => {
        const responseHeaders = new Headers();
        for (let i = 0; i < incoming.rawHeaders.length; i += 2) responseHeaders.append(incoming.rawHeaders[i], incoming.rawHeaders[i + 1]);
        resolve(new Response(Buffer.concat(chunks), { status: incoming.statusCode, headers: responseHeaders }));
      });
      incoming.on("error", reject);
    });
    outgoing.on("error", reject);
    outgoing.end(body);
  });
}
async function json(path, body, cookie) {
  return call(path, { method: "POST", headers: { origin, "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
}
async function value(response) {
  assert.equal(response.ok, true, "API response should succeed");
  const data = await response.json(); assert.equal(data.ok, true, "API envelope should succeed"); return data.value;
}
try {
  let ready = false;
  for (let i = 0; i < 60; i += 1) {
    try { if ((await fetch(base + "/api/health")).ok) { ready = true; break; } } catch { /* Wait for the child server. */ }
    await sleep(500);
  }
  assert.equal(ready, true, "Standalone cloud build must start");
  for (const path of ["/", "/cart", "/checkout", "/admin/orders", "/orders",
    "/api/demo/catalog", "/api/demo/admin/orders", "/api/demo/otp", "/_next/image?url=/media/teacher-portrait.webp&w=640&q=75"]) {
    const res = await call(path, { headers: { authorization: "" } });
    assert.equal(res.status, 401, "Unauthenticated route blocked: " + path);
  }
  const home = await call("/");
  assert.equal(home.status, 200);
  assert.match(home.headers.get("cache-control"), /no-store/);
  assert.equal(home.headers.get("x-frame-options"), "DENY");
  for (const unsafe of [{ origin: "" }, { origin: "null" }, { origin: "https://attacker.example" }, { "x-forwarded-host": "attacker.example" }]) {
    const res = await call("/api/demo/otp", { method: "POST", headers: { origin, "content-type": "application/json", ...unsafe }, body: JSON.stringify({ phone: "0912000001", purpose: "checkout" }) });
    assert.equal(res.status, 401);
  }
  assert.equal((await call("/api/demo/catalog?includeUnpublished=true")).ok, false);
  const catalog = await value(await call("/api/demo/catalog"));
  const product = catalog.items.find(p => p.publication === "published" && p.variants[0]?.inventoryStatus === "available");
  assert.ok(product);
  const otp = await value(await json("/api/demo/otp", { phone: "0912000001", purpose: "checkout" }));
  const draft = { name: "合成顧客", phone: "0912000001", deliveryMethod: "store-pickup", paymentMethod: "bank-transfer" };
  const order = await value(await json("/api/demo/orders", { phone: draft.phone, challengeId: otp.challengeId, code: otp.demoCode, draft,
    lines: [{ productId: product.id, variantId: product.variants[0].id, quantity: 1 }] }));
  assert.match(order.orderNumber, /^\d{6}-\d{3,}$/);
  assert.equal((await json("/api/demo/admin/session", { credential: merchant })).ok, false);
  // The password provider throttles all attempted logins, including obsolete payloads.
  if (authProvider === "password") await sleep(1100);
  const loginStatus = await value(await call("/api/demo/admin/session"));
  assert.equal(loginStatus.provider, authProvider);
  let login;
  if (authProvider === "password") {
    assert.equal((await json("/api/demo/admin/otp", { phone: "0912000000" })).ok, false, "SMS route disabled for password provider");
    login = await json("/api/demo/admin/session", { password });
  } else {
    const merchantOtp = await value(await json("/api/demo/admin/otp", { phone: "0912000000" }));
    const inbox = await value(await call("/api/demo/admin/otp/operator", { method: "POST", headers: { origin, "content-type": "application/json", "x-demo-merchant-operator": merchant }, body: JSON.stringify({challengeId: merchantOtp.challengeId}) }));
    login = await json("/api/demo/admin/session", { phone: "0912000000", challengeId: merchantOtp.challengeId, code: inbox.code });
  }
  await value(login);
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie, /__Host-demo_merchant=/);
  assert.match(cookie, /Secure;/);
  const session = cookie.split(";")[0];
  const orders = await value(await call("/api/demo/admin/orders", { headers: { cookie: session } }));
  assert.ok(orders.some(entry => entry.order.orderId === order.orderId));
  const orderRoute = "/api/demo/admin/orders/" + order.orderId;
  const paid = await value(await json(orderRoute, { action: "confirm-payment", reason: "synthetic receipt checked" }, session));
  assert.equal(paid.paymentStatus, "manual-confirmed");
  const revoked = await value(await json(orderRoute, { action: "revoke-payment", reason: "synthetic reversal check" }, session));
  assert.equal(revoked.paymentStatus, "pending-manual-verification");
  assert.equal(revoked.events.at(-1).action, "payment-revoked");
  await value(await json(orderRoute, { action: "confirm-payment", reason: "synthetic receipt rechecked" }, session));
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const uploadPhoto = async name => {
    const form = new FormData(); form.append("photo", new Blob([png], { type: "image/png" }), name);
    return value(await call(orderRoute + "/packing-photo", { method: "POST", headers: { origin, cookie: session }, body: form }));
  };
  await uploadPhoto("packing-original.png");
  const reopened = await value(await json(orderRoute, { action: "reopen-packing", reason: "synthetic photo replacement check" }, session));
  assert.equal(reopened.status, "confirmed");
  await uploadPhoto("packing-replacement.png");
  await value(await json(orderRoute, { action: "ship" }, session));
  const intercept = await value(await json(orderRoute, { action: "intercept-requested", reason: "synthetic logistics hold request" }, session));
  assert.equal(intercept.status, "shipped");
  assert.equal(intercept.shippingAttention.action, "intercept-requested");
  await value(await json(orderRoute, { action: "deliver" }, session));
  const lookupOtp = await value(await json("/api/demo/otp", { phone: draft.phone, purpose: "lookup" }));
  const lookup = await value(await json("/api/demo/orders/lookup", { orderId: order.orderNumber, accessSecret: order.accessSecret, phone: draft.phone,
    phoneLastThree: "001", customerName: draft.name, challengeId: lookupOtp.challengeId, code: lookupOtp.demoCode }));
  assert.equal(lookup.order.status, "delivered");
  assert.equal(lookup.order.shippingAttention.action, "intercept-requested");
  assert.deepEqual(lookup.order.events.filter(event => event.action).map(event => event.action), ["payment-confirmed", "payment-revoked", "payment-confirmed", "packed", "packing-reopened", "packed", "intercept-requested"]);
  // A test-only local edge emulates Render. Browser auth/cookies are unchanged.
  // Host/Origin rewriting happens at this edge, never in product guards.
  const browserBase = "http://127.0.0.1:3139";
  const edge = http.createServer((incoming, outgoing) => {
    if (incoming.headers.host !== "127.0.0.1:3139") { outgoing.writeHead(400); outgoing.end(); return; }
    const forwarded = { ...incoming.headers, host: "cheng-tea-password-demo.onrender.com", "x-forwarded-proto": "https" };
    delete forwarded["x-forwarded-host"]; delete forwarded.forwarded;
    if (forwarded.origin === browserBase) forwarded.origin = origin;
    const upstream = http.request(base + incoming.url, { method: incoming.method, headers: forwarded }, response => {
      outgoing.writeHead(response.statusCode, response.headers);
      response.pipe(outgoing);
    });
    upstream.on("error", () => { if (!outgoing.headersSent) { outgoing.writeHead(502); outgoing.end(); } else outgoing.destroy(); });
    incoming.pipe(upstream);
  });
  await new Promise((resolve, reject) => { edge.once("error", reject); edge.listen(3139, "127.0.0.1", resolve); });
  const { chromium, expect } = await import("@playwright/test");
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL: browserBase, viewport: { width: 412, height: 915 },
      httpCredentials: { username: "preview", password: token } });
    if (authProvider === "sms") await context.addCookies([{ name: "__Host-demo_merchant", value: session.split("=")[1], url: browserBase.replace("http:", "https:"), secure: true, httpOnly: true, sameSite: "Strict" }]);
    const page = await context.newPage();
    await page.goto("/tea/taiwan-mi-xiang-wild-mountain-tea");
    await page.getByRole("button", { name: "加入購物車" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await page.getByRole("link", { name: "前往結帳" }).click();
    await page.getByLabel("姓名", { exact: true }).fill("合成顧客");
    await page.getByLabel("合成手機").fill("0912000000");
    await page.getByRole("button", { name: "取得合成驗證碼" }).click();
    await expect(page.getByText("本機驗證碼：", { exact: false })).toContainText("123456");
    await page.getByLabel("驗證碼", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await expect(page.getByRole("heading", { name: "配送與付款" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "付款與聯絡資訊（展示資料）" })).toBeVisible();
    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await expect(page.getByText("付款狀態：待人工確認（不會扣款）", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "建立示範訂單" }).click();
    await expect(page.getByRole("heading", { name: "感謝您的購買" })).toBeVisible();
    await expect(page).toHaveURL(/\/checkout\/success\?order=[0-9]{6}-/);
    const lookupHref = await page.getByRole("link", { name: "主動查看訂單" }).getAttribute("href");
    const shortNumber = lookupHref.match(/[0-9]{6}-[0-9]{3,}/)[0];
    assert.equal(lookupHref.includes("token="), false);
    await page.evaluate(() => { window.__copiedOrder = ""; Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async text => { window.__copiedOrder = text; } } }); });
    await page.getByRole("button", { name: "複製訂單編號", exact: true }).click();
    await expect(page.getByText("已複製訂單編號", { exact: true })).toBeVisible();
    assert.equal(await page.evaluate(() => window.__copiedOrder), shortNumber);
    await page.goto(lookupHref);
    await page.getByLabel("顧客姓名").fill("合成顧客");
    await page.getByLabel("手機末三碼").fill("000");
    await page.getByRole("button", { name: "取得查單驗證碼" }).click();
    const firstLookupAt = Date.now();
    await page.getByLabel("驗證碼", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "查詢訂單", exact: true }).click();
    await expect(page.getByRole("heading", { name: "訂單成立", exact: true })).toBeVisible();
    await page.goto("/admin/orders");
    if (authProvider === "password") {
      await page.getByRole("button", { name: "緊急密碼登入", exact: true }).click();
      await page.getByLabel("緊急登入密碼", { exact: true }).fill(password);
      await page.getByRole("button", { name: "使用密碼登入", exact: true }).click();
    }
    const orderCard = page.locator(".demo-order-card").filter({ hasText: shortNumber }).first();
    await expect(orderCard).toBeVisible();
    await orderCard.getByRole("button", { name: "人工確認付款" }).click();
    const auditDialog = page.getByRole("dialog", { name: "人工確認付款" });
    await auditDialog.getByLabel("更正原因").fill("合成收款紀錄已核對");
    await auditDialog.getByRole("button", { name: "確認更正" }).click();
    await expect(orderCard).toContainText("已人工確認");
    let photoWrites = 0;
    page.on("request", request => { if (request.method() === "POST" && request.url().endsWith("/packing-photo")) photoWrites += 1; });
    const camera = orderCard.getByLabel("開啟相機");
    const gallery = orderCard.getByLabel("選擇相簿");
    await expect(camera).toHaveAttribute("capture", "environment");
    await expect(gallery).not.toHaveAttribute("capture");
    await camera.setInputFiles({ name: "camera.png", mimeType: "image/png", buffer: png });
    await expect(orderCard.getByRole("group", { name: "包裝照片預覽" })).toBeVisible();
    await expect(orderCard).toContainText("camera.png");
    assert.equal(photoWrites, 0, "Camera selection must not upload or mark packed");
    await orderCard.getByRole("button", { name: "取消", exact: true }).click();
    await expect(orderCard.getByRole("group", { name: "包裝照片預覽" })).toHaveCount(0);
    assert.equal(photoWrites, 0, "Cancel must leave order intact");
    await gallery.setInputFiles({ name: "gallery.png", mimeType: "image/png", buffer: png });
    await expect(orderCard).toContainText("gallery.png");
    await expect(orderCard.getByText("重選照片", { exact: true })).toBeVisible();
    await gallery.setInputFiles({ name: "reselected.png", mimeType: "image/png", buffer: png });
    await expect(orderCard).toContainText("reselected.png");
    await expect(orderCard.getByText("gallery.png", { exact: true })).toHaveCount(0);
    assert.equal(photoWrites, 0, "Reselect is preview only");
    await orderCard.getByRole("button", { name: "確認包裝", exact: true }).click();
    await expect(orderCard).toContainText("已打包");
    assert.equal(photoWrites, 1, "Explicit confirmation uploads once");
    await orderCard.getByRole("button", { name: "人工確認出貨" }).click();
    await expect(orderCard).toContainText("已出貨");
    await orderCard.getByRole("button", { name: "模擬送達" }).click();
    await expect(orderCard).toContainText("已送達");
    while (Date.now() < firstLookupAt + 61_000) await page.waitForTimeout(Math.min(1000, firstLookupAt + 61_000 - Date.now()));
    await page.goto(lookupHref);
    await page.getByLabel("顧客姓名").fill("合成顧客");
    await page.getByLabel("手機末三碼").fill("000");
    await page.getByRole("button", { name: "取得查單驗證碼" }).click();
    await page.getByLabel("驗證碼", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "查詢訂單", exact: true }).click();
    await expect(page.getByRole("heading", { name: "已送達", exact: true })).toBeVisible();
    await expect(page.getByText("包裝照片：已由店家上傳")).toBeVisible();
    await expect(page.getByText("訂單編號：" + shortNumber, { exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(412);

    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: "商品管理", exact: true })).toBeVisible();
    await expect(page.getByText("商品資料無法取得", { exact: true })).toHaveCount(0);
    await context.close();
    const { webkit } = await import("@playwright/test");
    const engine = process.env.DEMO_SMOKE_BROWSER === "webkit" ? webkit : chromium;
    const safari = await engine.launch();
    try {
      const fresh = await safari.newContext({ baseURL: browserBase, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, httpCredentials: { username: "preview", password: token } });
      const other = await fresh.newPage();
      await other.goto("/orders");
      assert.equal(await other.evaluate(() => sessionStorage.length), 0, "New device has no receipt");
      await expect(other.getByLabel("查單憑證")).toHaveCount(0);
      await expect(other.getByLabel("驗證用手機")).toHaveCount(0);
      const requests = [];
      other.on("request", r => { if (r.method() === "POST" && /\/api\/demo\/(otp|orders\/lookup)$/.test(r.url())) requests.push(r.postDataJSON()); });
      await other.getByLabel("訂單編號").fill(order.orderNumber);
      await other.getByLabel("顧客姓名").fill(draft.name);
      await other.getByLabel("手機末三碼").fill("001");
      await other.getByRole("button", { name: "取得查單驗證碼" }).click();
      await other.getByLabel("驗證碼", { exact: true }).fill("123456");
      await other.getByRole("button", { name: "查詢訂單", exact: true }).click();
      await expect(other.getByRole("heading", { name: "已送達", exact: true })).toBeVisible();
      assert.equal(requests.length, 2);
      assert.ok(requests.every(r => !("accessSecret" in r) && !("phone" in r)));
      await expect.poll(() => other.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await fresh.close();
      console.log("Mobile "+engine.name()+" cross-device PASS: empty storage, three fields+OTP, delivered, no secret/full phone, 390px no overflow.");
    } finally { await safari.close(); }

  } finally { await browser.close(); await new Promise(resolve => edge.close(resolve)); }
  console.log("Cloud browser smoke passed: phone checkout, Basic forwarding, Secure merchant cookie, catalog management.");
  console.log("Cloud smoke passed: private routes, CSRF, merchant cookie, bank-transfer order, packing, delivery, lookup.");
} finally {
  child.kill("SIGTERM");
  await new Promise(resolve => { if (child.exitCode !== null || child.signalCode) resolve(); else child.once("exit", resolve); });
  rmSync(directory, { recursive: true, force: true });
}
