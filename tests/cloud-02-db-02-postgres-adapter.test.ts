import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { describe, expect, it, beforeEach, afterAll } from "vitest";
import { PostgresOrderAdapter, requireProductionPostgres } from "@/lib/server/postgres-order-adapter";

const url = process.env.CLOUD02_DB_URL;
const root = process.cwd();
const schema = readFileSync(resolve(root, "docs/architecture/cloud-02-postgresql-schema.sql"), "utf8");
const db01 = readFileSync(resolve(root, "docs/architecture/cloud-02-db-01-contract-migration.sql"), "utf8");
const db02 = readFileSync(resolve(root, "docs/architecture/cloud-02-db-02-adapter-migration.sql"), "utf8");
const ids = { product: "00000000-0000-0000-0000-000000000001", variant: "00000000-0000-0000-0000-000000000002", actor: "00000000-0000-0000-0000-000000000005" };
const pool = new Pool({ connectionString: url });
const query = (text: string, values: unknown[] = []) => pool.query(text, values);
const request = (key: string, quantity = 1) => ({ idempotencyKey: key, orderNumber: `261016-${key.slice(-3)}`, customerName: "Synthetic Customer", phoneDigest: "a".repeat(64), paymentMethod: "cash" as const, lines: [{ productId: ids.product, variantId: ids.variant, quantity }] });

async function reset() {
  await query("DROP SCHEMA public CASCADE"); await query("CREATE SCHEMA public"); await query(schema); await query(db01); await query(db02);
  await query("INSERT INTO products(id,slug,name,category,summary,publication_status) VALUES($1,'synthetic-tea','Synthetic Tea','black','Synthetic only','published')", [ids.product]);
  await query("INSERT INTO product_variants(id,product_id,specification,price_amount,inventory_quantity) VALUES($1,$2,'one pack',100,2)", [ids.variant, ids.product]);
}

describe.skipIf(!url)("CLOUD-02 DB-02 PostgreSQL candidate adapter", () => {
  beforeEach(reset); afterAll(() => pool.end());

  it("creates an order, reserves stock and replays the exact original result", async () => {
    const adapter = new PostgresOrderAdapter(pool); const first = await adapter.createOrder(request("create-001")); const replay = await adapter.createOrder(request("create-001"));
    expect(replay).toEqual(first); expect((await query("SELECT count(*)::int AS n FROM orders")).rows[0].n).toBe(1); expect((await query("SELECT inventory_quantity FROM product_variants WHERE id=$1", [ids.variant])).rows[0].inventory_quantity).toBe(1);
  });
  it("rejects the same key with different content", async () => { const adapter = new PostgresOrderAdapter(pool); await adapter.createOrder(request("create-002", 1)); await expect(adapter.createOrder(request("create-002", 2))).rejects.toThrow(/IDEMPOTENCY/); });
  it("allows only one concurrent buyer of the final unit", async () => { await query("UPDATE product_variants SET inventory_quantity=1 WHERE id=$1", [ids.variant]); const a = new PostgresOrderAdapter(pool); const b = new PostgresOrderAdapter(pool); const result = await Promise.allSettled([a.createOrder(request("race-001")), b.createOrder(request("race-002"))]); expect(result.filter(x => x.status === "fulfilled")).toHaveLength(1); expect((await query("SELECT inventory_quantity FROM product_variants WHERE id=$1", [ids.variant])).rows[0].inventory_quantity).toBe(0); });
  it("confirms payment idempotently and rejects unpaid shipping", async () => { const adapter = new PostgresOrderAdapter(pool); const order = await adapter.createOrder(request("flow-001")); await expect(adapter.ship(order.orderId, "ship-before-payment", ids.actor)).rejects.toThrow(/PAYMENT|transition|payment/i); const paid = await adapter.confirmPayment(order.orderId, "payment-001", ids.actor); const replay = await adapter.confirmPayment(order.orderId, "payment-001", ids.actor); expect(replay).toEqual(paid); expect((await query("SELECT count(*)::int AS n FROM order_events WHERE order_id=$1", [order.orderId])).rows[0].n).toBe(1); });
  it("requires packing evidence before shipping and consumes reservation once", async () => { const adapter = new PostgresOrderAdapter(pool); const order = await adapter.createOrder(request("flow-002")); await adapter.confirmPayment(order.orderId, "payment-002", ids.actor); await expect(adapter.ship(order.orderId, "ship-002", ids.actor)).rejects.toThrow(/PHOTO|packing|transition/i); await adapter.attachPackingPhoto(order.orderId, "photo-002", ids.actor); await adapter.ship(order.orderId, "ship-002", ids.actor); expect((await query("SELECT status FROM cloud02_inventory_reservations WHERE order_id=$1", [order.orderId])).rows[0].status).toBe("consumed"); });
  it("cancels once and releases stock without double release", async () => { const adapter = new PostgresOrderAdapter(pool); const order = await adapter.createOrder(request("cancel-001")); await adapter.cancel(order.orderId, "cancel-001", ids.actor); await expect(adapter.cancel(order.orderId, "cancel-002", ids.actor)).rejects.toThrow(/CANCELLATION/); expect((await query("SELECT inventory_quantity FROM product_variants WHERE id=$1", [ids.variant])).rows[0].inventory_quantity).toBe(2); expect((await query("SELECT count(*)::int AS n FROM cloud02_inventory_reservations WHERE status='released'")).rows[0].n).toBe(1); });
  it("rolls back order and reservation when a transaction fails", async () => { const adapter = new PostgresOrderAdapter(pool); await expect(adapter.createOrder({ ...request("rollback-001"), orderNumber: "261016-001", lines: [{ productId: ids.product, variantId: "00000000-0000-0000-0000-000000000099", quantity: 1 }] })).rejects.toThrow(); expect((await query("SELECT count(*)::int AS n FROM orders")).rows[0].n).toBe(0); expect((await query("SELECT inventory_quantity FROM product_variants WHERE id=$1", [ids.variant])).rows[0].inventory_quantity).toBe(2); });
  it("keeps paid reservations safe from expiration", async () => { const adapter = new PostgresOrderAdapter(pool); const order = await adapter.createOrder(request("expire-001")); await adapter.confirmPayment(order.orderId, "payment-003", ids.actor); await query("UPDATE cloud02_inventory_reservations SET expires_at=now()-interval '1 minute' WHERE order_id=$1", [order.orderId]); await query("SELECT expire_cloud02_inventory(now())"); expect((await query("SELECT status FROM cloud02_inventory_reservations WHERE order_id=$1", [order.orderId])).rows[0].status).toBe("active"); expect((await query("SELECT inventory_quantity FROM product_variants WHERE id=$1", [ids.variant])).rows[0].inventory_quantity).toBe(1); });
  it("fails closed for missing or non-PostgreSQL configuration", () => { const old = process.env.COMMERCE_BACKEND; const oldUrl = process.env.CLOUD02_DB_URL; delete process.env.COMMERCE_BACKEND; expect(() => requireProductionPostgres()).toThrow(/opt-in/); process.env.COMMERCE_BACKEND = "postgres"; delete process.env.CLOUD02_DB_URL; expect(() => requireProductionPostgres()).toThrow(/invalid/); if (old === undefined) delete process.env.COMMERCE_BACKEND; else process.env.COMMERCE_BACKEND = old; if (oldUrl === undefined) delete process.env.CLOUD02_DB_URL; else process.env.CLOUD02_DB_URL = oldUrl; });
});

if (!existsSync(resolve(root, "docs/architecture/cloud-02-db-02-adapter-migration.sql"))) throw new Error("DB-02 migration missing");
