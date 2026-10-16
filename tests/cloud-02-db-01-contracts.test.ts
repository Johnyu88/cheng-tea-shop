import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Pool } from "pg";

const databaseUrl = process.env.CLOUD02_DB_URL;
const referenceSchemaPath = resolve(process.cwd(), "docs/architecture/cloud-02-postgresql-schema.sql");
const migrationPath = resolve(process.cwd(), "docs/architecture/cloud-02-db-01-contract-migration.sql");
const referenceSchema = readFileSync(referenceSchemaPath, "utf8");

const ids = {
  product: "00000000-0000-0000-0000-000000000001",
  variant: "00000000-0000-0000-0000-000000000002",
  order: "00000000-0000-0000-0000-000000000003",
  secondOrder: "00000000-0000-0000-0000-000000000004",
  actor: "00000000-0000-0000-0000-000000000005",
  payment: "00000000-0000-0000-0000-000000000006",
  photo: "00000000-0000-0000-0000-000000000007",
};

const pool = new Pool({ connectionString: databaseUrl });

async function query(text: string, values: unknown[] = []) {
  return pool.query(text, values);
}

async function installMigration() {
  if (!existsSync(migrationPath)) throw new Error("CLOUD-02 DB-01 migration is not implemented");
  const migration = readFileSync(migrationPath, "utf8");
  await query("BEGIN");
  try {
    await query(migration);
    await query("COMMIT");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}

async function resetDatabase() {
  await query("DROP SCHEMA public CASCADE");
  await query("CREATE SCHEMA public");
  await query(referenceSchema);
}

async function seedOrder(orderId = ids.order, orderNumber = "260101-001", itemId = "00000000-0000-0000-0000-000000000008") {
  await query("BEGIN");
  await query(
    `INSERT INTO orders (
       id, order_number, customer_name, phone_digest, delivery_method, payment_method,
       subtotal_amount, shipping_amount, total_amount, lookup_digest
     ) VALUES ($1, $2, 'Synthetic Customer', repeat('a', 64), 'store_pickup', 'cash', 100, 0, 100, repeat('b', 64))`,
    [orderId, orderNumber],
  );
  await query(
    `INSERT INTO order_items (
       id, order_id, product_id, variant_id, product_name_snapshot,
       specification_snapshot, unit_price_amount, quantity, line_total_amount
     ) VALUES ($1, $2, $3, $4, 'Synthetic Tea', 'one pack', 100, 1, 100)`,
    [itemId, orderId, ids.product, ids.variant],
  );
  await query("COMMIT");
}

async function seedVariant(quantity = 5, variantId = ids.variant) {
  await query(
    `INSERT INTO products (id, slug, name, category, summary)
     VALUES ($1, $2, 'Synthetic Tea', 'black', 'Synthetic only')
     ON CONFLICT (id) DO NOTHING`,
    [ids.product, `synthetic-${variantId.slice(-4)}`],
  );
  await query(
    `INSERT INTO product_variants (id, product_id, specification, price_amount, inventory_quantity)
     VALUES ($1, $2, 'one pack', 100, $3)`,
    [variantId, ids.product, quantity],
  );
}

async function seedConsistentOrder(orderId = ids.order, orderNumber = "260101-001") {
  await seedOrder(orderId, orderNumber);
  await query(
    `INSERT INTO payments (id, order_id, method, amount)
     VALUES ($1, $2, 'cash', 100)`,
    [ids.payment, orderId],
  );
}

beforeEach(async () => {
  await resetDatabase();
  await installMigration();
});

afterAll(async () => {
  await pool.end();
});

describe.skipIf(!databaseUrl)("CLOUD-02 DB-01 PostgreSQL contracts", () => {
  it("installs a compatible marker and can be safely re-applied", async () => {
    const before = await query("SELECT version, contract_hash FROM cloud02_contract_migration WHERE contract_name = 'cloud-02-db-01'");
    expect(before.rows).toHaveLength(1);
    await installMigration();
    const after = await query("SELECT version, contract_hash FROM cloud02_contract_migration WHERE contract_name = 'cloud-02-db-01'");
    expect(after.rows).toEqual(before.rows);

    await query("BEGIN");
    await query("UPDATE cloud02_contract_migration SET version = 999 WHERE contract_name = 'cloud-02-db-01'");
    await expect(query(readFileSync(migrationPath, "utf8"))).rejects.toThrow(/incompatible/i);
    await query("ROLLBACK");
  });

  it.each([
    ["order-create", "00000000-0000-0000-0000-000000000011", "order"],
    ["payment-event", "00000000-0000-0000-0000-000000000012", "payment_event"],
    ["shipment-event", "00000000-0000-0000-0000-000000000013", "shipment_event"],
  ])("replays a same-hash %s request and rejects a different hash", async (scope, resourceId, resourceType) => {
    const first = await query(
      `SELECT * FROM claim_cloud02_idempotency($1, 'same-key', repeat('1', 64), 201, '{"ok":true}'::jsonb, $2, $3)`,
      [scope, resourceType, resourceId],
    );
    const replay = await query(
      `SELECT * FROM claim_cloud02_idempotency($1, 'same-key', repeat('1', 64), 201, '{"ok":true}'::jsonb, $2, $3)`,
      [scope, resourceType, resourceId],
    );
    expect(first.rows[0]).toMatchObject({ replayed: false, response_code: 201, resource_id: resourceId });
    expect(replay.rows[0]).toMatchObject({ replayed: true, response_code: 201, resource_id: resourceId });
    await expect(query(
      `SELECT * FROM claim_cloud02_idempotency($1, 'same-key', repeat('2', 64), 201, '{"ok":true}'::jsonb, $2, $3)`,
      [scope, resourceType, resourceId],
    )).rejects.toThrow(/IDEMPOTENCY_KEY_REUSED/);
  });

  it.each([
    ["line", 100, 0, 100, 99, 100, /LINE_TOTAL/],
    ["subtotal", 101, 0, 101, 100, 100, /SUBTOTAL/],
    ["shipping", 100, 10, 100, 100, 100, /TOTAL/],
    ["payment", 100, 0, 100, 100, 99, /PAYMENT/],
  ])("rejects inconsistent %s amount at transaction commit", async (kind, subtotal, shipping, total, lineTotal, paymentAmount, errorPattern) => {
    await seedVariant();
    await query("BEGIN");
    await query(
      `INSERT INTO orders (
         id, order_number, customer_name, phone_digest, delivery_method, payment_method,
         subtotal_amount, shipping_amount, total_amount, lookup_digest
       ) VALUES ($1, $2, 'Synthetic Customer', repeat('a', 64), 'store_pickup', 'cash', $3, $4, $5, repeat('b', 64))`,
      [ids.order, `260101-${String(kind).slice(0, 3)}`, subtotal, shipping, total],
    );
    await query(
      `INSERT INTO order_items (id, order_id, product_id, variant_id, product_name_snapshot, specification_snapshot, unit_price_amount, quantity, line_total_amount)
       VALUES ('00000000-0000-0000-0000-000000000009', $1, $2, $3, 'Synthetic Tea', 'one pack', 100, 1, $4)`,
      [ids.order, ids.product, ids.variant, lineTotal],
    );
    await query(
      `INSERT INTO payments (id, order_id, method, amount)
       VALUES ($1, $2, 'cash', $3)`,
      [ids.payment, ids.order, paymentAmount],
    );
    await expect(query("COMMIT")).rejects.toThrow(errorPattern);
    await query("ROLLBACK").catch(() => undefined);
  });

  it("requires confirmed payment and packing evidence before shipment", async () => {
    await seedVariant();
    await seedConsistentOrder();
    await expect(query(
      `SELECT transition_cloud02_order($1, 'payment_confirmed', $2, 'staff', 'transition-1', repeat('3', 64))`,
      [ids.order, ids.actor],
    )).rejects.toThrow(/payment/i);
    await query("UPDATE payments SET status = 'confirmed', confirmed_by = $1, confirmed_at = now() WHERE order_id = $2", [ids.actor, ids.order]);
    await query(
      `SELECT transition_cloud02_order($1, 'payment_confirmed', $2, 'staff', 'transition-1', repeat('3', 64))`,
      [ids.order, ids.actor],
    );
    await expect(query(
      `SELECT transition_cloud02_order($1, 'packed', $2, 'staff', 'transition-2', repeat('4', 64))`,
      [ids.order, ids.actor],
    )).rejects.toThrow(/photo|packing/i);
    await query(
      `INSERT INTO packing_photos (id, order_id, object_key, mime_type, byte_length, sha256_hex, confirmed_by)
       VALUES ($1, $2, 'synthetic/packing.jpg', 'image/jpeg', 10, repeat('a', 64), $3)`,
      [ids.photo, ids.order, ids.actor],
    );
    await query(
      `SELECT transition_cloud02_order($1, 'packed', $2, 'staff', 'transition-2', repeat('4', 64))`,
      [ids.order, ids.actor],
    );
    await query(
      `SELECT transition_cloud02_order($1, 'shipped', $2, 'staff', 'transition-3', repeat('5', 64))`,
      [ids.order, ids.actor],
    );
    await query(
      `SELECT transition_cloud02_order($1, 'shipped', $2, 'staff', 'transition-3', repeat('5', 64))`,
      [ids.order, ids.actor],
    );
    await expect(query(
      `SELECT transition_cloud02_order($1, 'delivered', $2, 'staff', 'transition-3', repeat('6', 64))`,
      [ids.order, ids.actor],
    )).rejects.toThrow(/IDEMPOTENCY_KEY_REUSED/);
    const status = await query("SELECT status FROM orders WHERE id = $1", [ids.order]);
    expect(status.rows[0]?.status).toBe("shipped");
    const events = await query("SELECT count(*)::int AS count FROM order_events WHERE order_id = $1", [ids.order]);
    expect(events.rows[0]?.count).toBe(3);
  });

  it("allows exactly one reservation when two transactions compete for the final unit", async () => {
    await seedVariant(1);
    await seedOrder(ids.order, "260101-001", "00000000-0000-0000-0000-000000000008");
    await seedOrder(ids.secondOrder, "260101-002", "00000000-0000-0000-0000-000000000009");
    const first = new Client({ connectionString: databaseUrl });
    const second = new Client({ connectionString: databaseUrl });
    await Promise.all([first.connect(), second.connect()]);
    const reserve = async (client: Client, orderId: string) => {
      await client.query("BEGIN");
      try {
        await client.query(
          `SELECT reserve_cloud02_inventory($1, $2, 1, $3)`,
          [ids.variant, orderId, "00000000-0000-0000-0000-000000000010"],
        );
        await client.query("COMMIT");
        return "success";
      } catch {
        await client.query("ROLLBACK");
        return "rejected";
      }
    };
    const results = await Promise.all([reserve(first, ids.order), reserve(second, ids.secondOrder)]);
    await Promise.all([first.end(), second.end()]);
    expect(results.sort()).toEqual(["rejected", "success"]);
    const stock = await query("SELECT inventory_quantity FROM product_variants WHERE id = $1", [ids.variant]);
    expect(stock.rows[0]?.inventory_quantity).toBe(0);
    const reservations = await query("SELECT count(*)::int AS count FROM cloud02_inventory_reservations");
    expect(reservations.rows[0]?.count).toBe(1);
  });

  it("rolls back an inventory reservation without consuming stock", async () => {
    await seedVariant(1);
    await seedOrder();
    await query("BEGIN");
    await query(`SELECT reserve_cloud02_inventory($1, $2, 1, $3)`, [ids.variant, ids.order, "00000000-0000-0000-0000-000000000010"]);
    await query("ROLLBACK");
    const stock = await query("SELECT inventory_quantity FROM product_variants WHERE id = $1", [ids.variant]);
    expect(stock.rows[0]?.inventory_quantity).toBe(1);
    const reservations = await query("SELECT count(*)::int AS count FROM cloud02_inventory_reservations");
    expect(reservations.rows[0]?.count).toBe(0);
  });
});
