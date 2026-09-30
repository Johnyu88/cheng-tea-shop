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
const origin = "https://tea-ci.onrender.com";
const base = "http://127.0.0.1:3138";
const child = spawn(process.execPath, ["start-cloud-demo.mjs"], {
  stdio: ["ignore", "inherit", "inherit"],
  env: { ...process.env, PORT: "3138", HOSTNAME: "127.0.0.1", NODE_ENV: "production",
    NEXT_PUBLIC_DEMO_COMMERCE: "enabled", DEMO_COMMERCE_CLOUD: "enabled",
    DEMO_COMMERCE_LOCAL: "", DEMO_COMMERCE_LAN: "", DEMO_CLOUD_ORIGIN: origin,
    DEMO_PREVIEW_TOKEN_SHA256: createHash("sha256").update(token).digest("hex"),
    DEMO_MERCHANT_SECRET: merchant, DEMO_DATA_DIR: directory },
});
const headers = { host: "tea-ci.onrender.com", "x-forwarded-proto": "https",
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
  const login = await json("/api/demo/admin/session", { credential: merchant });
  await value(login);
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie, /__Host-demo_merchant=/);
  assert.match(cookie, /Secure;/);
  const session = cookie.split(";")[0];
  const orders = await value(await call("/api/demo/admin/orders", { headers: { cookie: session } }));
  assert.ok(orders.some(entry => entry.order.orderId === order.orderId));
  await value(await json("/api/demo/admin/orders/" + order.orderId, { action: "confirm-payment" }, session));
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const form = new FormData(); form.append("photo", new Blob([png], { type: "image/png" }), "packing.png");
  await value(await call("/api/demo/admin/orders/" + order.orderId + "/packing-photo", { method: "POST", headers: { origin, cookie: session }, body: form }));
  await value(await json("/api/demo/admin/orders/" + order.orderId, { action: "ship" }, session));
  await value(await json("/api/demo/admin/orders/" + order.orderId, { action: "deliver" }, session));
  const lookupOtp = await value(await json("/api/demo/otp", { phone: draft.phone, purpose: "lookup" }));
  const lookup = await value(await json("/api/demo/orders/lookup", { orderId: order.orderId, accessSecret: order.accessSecret, phone: draft.phone,
    phoneLastThree: "001", customerName: draft.name, challengeId: lookupOtp.challengeId, code: lookupOtp.demoCode }));
  assert.equal(lookup.order.status, "delivered");
  // A test-only local edge emulates Render. Browser auth/cookies are unchanged.
  // Host/Origin rewriting happens at this edge, never in product guards.
  const browserBase = "http://127.0.0.1:3139";
  const edge = http.createServer((incoming, outgoing) => {
    if (incoming.headers.host !== "127.0.0.1:3139") { outgoing.writeHead(400); outgoing.end(); return; }
    const forwarded = { ...incoming.headers, host: "tea-ci.onrender.com", "x-forwarded-proto": "https" };
    delete forwarded["x-forwarded-host"]; delete forwarded.forwarded;
    if (forwarded.origin === browserBase) forwarded.origin = origin;
    const upstream = http.request(base + incoming.url, { method: incoming.method, headers: forwarded }, response => {
      outgoing.writeHead(response.statusCode, response.headers);
      response.pipe(outgoing);
    });
    upstream.on("error", () => { outgoing.writeHead(502); outgoing.end(); });
    incoming.pipe(upstream);
  });
  await new Promise((resolve, reject) => { edge.once("error", reject); edge.listen(3139, "127.0.0.1", resolve); });
  const { chromium, expect } = await import("@playwright/test");
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL: browserBase, viewport: { width: 412, height: 915 },
      httpCredentials: { username: "preview", password: token } });
    const page = await context.newPage();
    await page.goto("/tea/taiwan-mi-xiang-wild-mountain-tea");
    await page.getByRole("button", { name: "加入購物車" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await page.getByRole("link", { name: "前往結帳" }).click();
    await page.getByLabel("姓名", { exact: true }).fill("合成顧客");
    await page.getByLabel("合成手機").fill("0912000001");
    await page.getByRole("button", { name: "取得合成驗證碼" }).click();
    await expect(page.getByText("本機驗證碼：", { exact: false })).toContainText("123456");
    await page.getByLabel("驗證碼", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await expect(page.getByRole("heading", { name: "配送與付款" })).toBeVisible();
    await page.getByRole("radio", { name: "銀行轉帳", exact: true }).check();
    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await expect(page.getByText("付款狀態：待人工確認（不會扣款）", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "建立示範訂單" }).click();
    await expect(page.getByRole("heading", { name: "感謝您的購買" })).toBeVisible();
    await page.goto("/admin/orders");
    await page.getByLabel("商家 Demo 憑證").fill(merchant);
    await page.getByRole("button", { name: "登入商家 Demo" }).click();
    await expect(page.locator(".demo-order-card").first()).toBeVisible();
    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: "商品管理", exact: true })).toBeVisible();
    await expect(page.getByText("商品資料無法取得", { exact: true })).toHaveCount(0);
    await context.close();
  } finally { await browser.close(); await new Promise(resolve => edge.close(resolve)); }
  console.log("Cloud browser smoke passed: phone checkout, Basic forwarding, Secure merchant cookie, catalog management.");
  console.log("Cloud smoke passed: private routes, CSRF, merchant cookie, bank-transfer order, packing, delivery, lookup.");
} finally {
  child.kill("SIGTERM");
  await new Promise(resolve => { if (child.exitCode !== null || child.signalCode) resolve(); else child.once("exit", resolve); });
  rmSync(directory, { recursive: true, force: true });
}
