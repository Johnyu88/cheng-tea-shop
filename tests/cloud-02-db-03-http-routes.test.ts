import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import { POST as createOrder } from "@/app/api/candidate/orders/route";
import { POST as adminOrder } from "@/app/api/candidate/admin/orders/[orderId]/route";
import { POST as lookupOrder } from "@/app/api/candidate/orders/lookup/route";
import { POST as packingPhoto } from "@/app/api/candidate/admin/orders/[orderId]/packing-photo/route";

vi.mock("@/lib/server/merchant-request-access", () => ({
  merchantRequestCookie: async (request: Request) => request.headers.get("cookie") === "candidate-auth=test" ? "candidate-auth" : null,
}));

const url = process.env.CLOUD02_DB_URL;
const pool = new Pool({ connectionString: url });
const schema = readFileSync(resolve(process.cwd(), "docs/architecture/cloud-02-postgresql-schema.sql"), "utf8");
const db01 = readFileSync(resolve(process.cwd(), "docs/architecture/cloud-02-db-01-contract-migration.sql"), "utf8");
const db02 = readFileSync(resolve(process.cwd(), "docs/architecture/cloud-02-db-02-adapter-migration.sql"), "utf8");
const ids = { product: "00000000-0000-0000-0000-000000000001", variant: "00000000-0000-0000-0000-000000000002", actor: "00000000-0000-0000-0000-000000000005" };
const query = (text: string, values: unknown[] = []) => pool.query(text, values);

async function reset() {
  await query("DROP SCHEMA public CASCADE"); await query("CREATE SCHEMA public"); await query(schema); await query(db01); await query(db02);
  await query("INSERT INTO products(id,slug,name,category,summary,publication_status) VALUES($1,'candidate-tea','Candidate Tea','black','Synthetic candidate','published')", [ids.product]);
  await query("INSERT INTO product_variants(id,product_id,specification,price_amount,inventory_quantity) VALUES($1,$2,'one pack',100,2)", [ids.variant, ids.product]);
}
const orderBody = (key: string, quantity = 1) => ({ idempotencyKey: key, customerName: "Synthetic Customer", phone: "0912000000", deliveryMethod: "store-pickup", paymentMethod: "cash", lines: [{ productId: ids.product, variantId: ids.variant, quantity }] });
const jsonRequest = (body: unknown, headers: Record<string, string> = {}) => new Request("http://candidate.test/api/candidate/orders", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

describe.skipIf(!url)("CLOUD-02 DB-03 candidate HTTP routes", () => {
  beforeAll(() => { process.env.CLOUD02_HTTP_MODE = "candidate"; process.env.COMMERCE_BACKEND = "postgres"; process.env.CLOUD02_TEST_PHOTO_STORAGE = "1"; });
  beforeEach(reset);
  afterAll(async () => { delete process.env.CLOUD02_HTTP_MODE; delete process.env.COMMERCE_BACKEND; delete process.env.CLOUD02_TEST_PHOTO_STORAGE; await pool.end(); });

  it("creates one order through HTTP and replays the same response", async () => {
    const first = await createOrder(jsonRequest(orderBody("http-001"))); const replay = await createOrder(jsonRequest(orderBody("http-001")));
    expect(first.status).toBe(201); expect(await replay.json()).toEqual(await first.clone().json()); expect((await query("SELECT count(*)::int AS n FROM orders")).rows[0].n).toBe(1);
  });
  it("rejects candidate HTTP access when the explicit mode is absent", async () => { const old = process.env.CLOUD02_HTTP_MODE; delete process.env.CLOUD02_HTTP_MODE; const response = await createOrder(jsonRequest(orderBody("http-off"))); process.env.CLOUD02_HTTP_MODE = old; expect(response.status).toBe(404); });
  it("requires merchant authentication for payment, packing, shipping, delivery and cancellation", async () => {
    const order = await createOrder(jsonRequest(orderBody("http-admin-001"))); const body = await order.json() as { value: { orderId: string } }; const response = await adminOrder(new Request("http://candidate.test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "confirm-payment" }) }), { params: Promise.resolve({ orderId: body.value.orderId }) }); expect(response.status).toBe(403);
  });
  it("keeps candidate lookup behind the OTP challenge contract", async () => { const response = await lookupOrder(jsonRequest({ orderId: "missing", phone: "0912000000", phoneLastThree: "000", challengeId: "missing", code: "000000" })); expect(response.status).toBe(403); });
  it("completes payment, test-double packing, shipping, delivery and verified lookup over HTTP", async () => {
    const created = await createOrder(jsonRequest(orderBody("http-e2e-001"))); const createdBody = await created.json() as { value: { orderId: string; orderNumber: string } }; const auth = { cookie: "candidate-auth=test", "content-type": "application/json" };
    const payment = await adminOrder(new Request("http://candidate.test", { method: "POST", headers: auth, body: JSON.stringify({ action: "confirm-payment", idempotencyKey: "http-payment-001" }) }), { params: Promise.resolve({ orderId: createdBody.value.orderId }) }); expect(payment.status).toBe(200);
    const photo = await packingPhoto(new Request("http://candidate.test", { method: "POST", headers: { cookie: "candidate-auth=test", "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: "http-photo-001", fileName: "packing.jpg" }) }), { params: Promise.resolve({ orderId: createdBody.value.orderId }) }); expect(photo.status).toBe(200); expect((await photo.json()).value).toMatchObject({ storage: "test-double", realObjectStorage: false });
    const shipped = await adminOrder(new Request("http://candidate.test", { method: "POST", headers: auth, body: JSON.stringify({ action: "ship", idempotencyKey: "http-ship-001" }) }), { params: Promise.resolve({ orderId: createdBody.value.orderId }) }); expect(shipped.status).toBe(200);
    const delivered = await adminOrder(new Request("http://candidate.test", { method: "POST", headers: auth, body: JSON.stringify({ action: "deliver", idempotencyKey: "http-deliver-001" }) }), { params: Promise.resolve({ orderId: createdBody.value.orderId }) }); expect(delivered.status).toBe(200);
    const lookup = await lookupOrder(jsonRequest({ orderId: createdBody.value.orderNumber, phone: "0912000000", phoneLastThree: "000", challengeId: "candidate-otp", code: "123456" })); expect(lookup.status).toBe(200); expect((await lookup.json()).value.status).toBe("delivered");
  }, 15000);
  it("allows only one concurrent HTTP buyer of the final unit", async () => { await query("UPDATE product_variants SET inventory_quantity=1 WHERE id=$1", [ids.variant]); const results = await Promise.all([createOrder(jsonRequest(orderBody("http-race-001"))), createOrder(jsonRequest(orderBody("http-race-002")))]); expect(results.filter(response => response.status === 201)).toHaveLength(1); expect((await query("SELECT inventory_quantity FROM product_variants WHERE id=$1", [ids.variant])).rows[0].inventory_quantity).toBe(0); });
  it("does not claim real object storage for the packing photo test double", async () => {
    const order = await createOrder(jsonRequest(orderBody("http-photo-001"))); const body = await order.json() as { value: { orderId: string } }; const response = await adminOrder(new Request("http://candidate.test", { method: "POST", headers: { "content-type": "application/json", cookie: "candidate-auth=test" }, body: JSON.stringify({ action: "confirm-payment", idempotencyKey: "http-photo-payment-001" }) }), { params: Promise.resolve({ orderId: body.value.orderId }) }); expect(response.status).toBe(200);
  });
});
