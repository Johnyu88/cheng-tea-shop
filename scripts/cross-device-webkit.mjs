import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const load = createRequire(import.meta.url);
let pw; try { pw = load('@playwright/test'); } catch { pw = load('playwright'); }
const origin = 'https://cheng-tea-password-demo.onrender.com';
const gate = process.env.DEMO_ACCEPTANCE_PREVIEW_PASSWORD;
const password = process.env.DEMO_ACCEPTANCE_PASSWORD;
if (!gate || !password) throw new Error('Missing private acceptance configuration');
(async () => {
  const browser = await pw.webkit.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
  try {
    console.log('WebKit launched');
    const options = { ...pw.devices['iPhone 13'], baseURL: origin, httpCredentials: { username: 'preview', password: gate } };
    const setup = await browser.newContext(options); console.log('Setup context created');
    const headers = { origin, authorization: 'Basic ' + Buffer.from('preview:' + gate).toString('base64') };
    const value = async r => { const p = await r.json(); assert.equal(r.ok(), true, p.error); assert.equal(p.ok, true); return p.value; };
    const post = async (path, data) => { console.log('API ' + path); return value(await setup.request.post(path, { headers, data, timeout:20000 })); };
    const catalog = await value(await setup.request.get('/api/demo/catalog', {timeout:20000})); console.log('Catalog read');
    const item = catalog.items.find(p => p.publication === 'published' && p.variants.some(v => v.inventoryStatus === 'available'));
    const variant = item.variants.find(v => v.inventoryStatus === 'available');
    const otp = await post('/api/demo/otp', { phone: '0912000000', purpose: 'checkout' });
    const placed = await post('/api/demo/orders', { phone: '0912000000', challengeId: otp.challengeId, code: otp.demoCode, draft: { name: '手機查單', phone: '0912000000', deliveryMethod: 'store-pickup', paymentMethod: 'bank-transfer' }, lines: [{ productId: item.id, variantId: variant.id, quantity: 1 }] });
    await post('/api/demo/admin/session', { password });
    const path = '/api/demo/admin/orders/' + placed.orderId;
    await post(path, { action: 'confirm-payment' });
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    await value(await setup.request.post(path + '/packing-photo', { headers, multipart: { photo: { name: 'packing.png', mimeType: 'image/png', buffer: png } } }));
    await post(path, { action: 'ship' }); await post(path, { action: 'deliver' });
    console.log('Fixture ready: ' + placed.orderNumber); await setup.close();
    const fresh = await browser.newContext(options); const page = await fresh.newPage();
    page.setDefaultTimeout(30000); await page.goto('/orders'); console.log('Fresh WebKit lookup page loaded');
    assert.equal(await page.evaluate(() => sessionStorage.length), 0);
    assert.equal(await page.getByLabel('查單憑證').count(), 0); assert.equal(await page.getByLabel('驗證用手機').count(), 0);
    const payloads = []; page.on('request', r => { if (r.method() === 'POST' && /\/api\/demo\/(otp|orders\/lookup)$/.test(r.url())) payloads.push(r.postDataJSON()); });
    await page.getByLabel('訂單編號').fill(placed.orderNumber); await page.getByLabel('顧客姓名').fill('手機查單'); await page.getByLabel('手機末三碼').fill('000');
    await page.getByRole('button', { name: '取得查單驗證碼' }).click(); await page.getByLabel('驗證碼', { exact: true }).fill('123456');
    await page.getByRole('button', { name: '查詢訂單', exact: true }).click(); await page.getByRole('heading', { name: '已送達', exact: true }).waitFor();
    assert.equal(payloads.length, 2); assert.ok(payloads.every(p => !('accessSecret' in p) && !('phone' in p)));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log('HTTPS mobile WebKit cross-device PASS: fresh context, no storage, three identity fields + OTP, delivered, no secret/full phone, no horizontal overflow.');
    console.log('Retained order: ' + placed.orderNumber + '; name: 手機查單; suffix: 000');
    await fresh.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(String(e.message).split(gate).join('[redacted]').split(password).join('[redacted]')); process.exitCode = 1; });
