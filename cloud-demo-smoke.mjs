import assert from "node:assert/strict";
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
const child = spawn(process.execPath, ["scripts/start-playwright-standalone.mjs"], {
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
async function call(path, init = {}) { return fetch(base + path, { ...init, redirect: "manual", headers: { ...headers, ...(init.headers ?? {}) } }); }
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
    try { if ((await fetch(base + "/api/health")).ok) { ready = true; break; } } catch {}
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
  console.log("Cloud smoke passed: private routes, CSRF, merchant cookie, bank-transfer order, packing, delivery, lookup.");
} finally {
  child.kill("SIGTERM");
  await new Promise(resolve => { if (child.exitCode !== null || child.signalCode) resolve(); else child.once("exit", resolve); });
  rmSync(directory, { recursive: true, force: true });
}
