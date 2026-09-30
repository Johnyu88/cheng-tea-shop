// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import { seedIndependentDemo, fixedSeedOrderId } from "../lib/server/demo-fixed-seed";
const directories: string[] = [];
const fresh = () => { const dir = mkdtempSync(join(tmpdir(), "tea-seed-")); directories.push(dir); return dir; };
afterEach(() => directories.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));
const env = { DEMO_FIXED_SEED: "issue-24-yu-800", DEMO_COMMERCE_CLOUD: "enabled", RENDER_SERVICE_ID: "srv-new-isolated" };
it("reconstructs exact synthetic Yu800 target once without a recoverable credential", () => {
  const dir = fresh();
  expect(seedIndependentDemo(dir, env)).toBe(true);
  const db = new DatabaseSync(join(dir, "orders.sqlite"));
  const before = db.prepare("SELECT * FROM demo_orders").all();
  expect(before).toHaveLength(1);
  const row = before[0] as { order_id: string; snapshot: string; secret_digest: string };
  expect(row.order_id).toBe(fixedSeedOrderId);
  expect(JSON.parse(row.snapshot).total).toEqual({ currency: "TWD", amount: 800 });
  expect(row.secret_digest).toMatch(/^[a-f0-9]{64}$/);
  expect(seedIndependentDemo(dir, env)).toBe(false);
  expect(db.prepare("SELECT * FROM demo_orders").all()).toEqual(before);
  db.close();
});
it("preserves an existing nonempty database byte-for-byte logically", () => {
  const dir = fresh(); const db = new DatabaseSync(join(dir, "orders.sqlite"));
  db.exec("CREATE TABLE preserved(value TEXT); INSERT INTO preserved VALUES ('keep-me')");
  expect(seedIndependentDemo(dir, env)).toBe(false);
  expect(db.prepare("SELECT value FROM preserved").get()).toEqual({ value: "keep-me" });
  db.close();
});
it("denies original service and origin and requires explicit cloud seed opt-in", () => {
  expect(seedIndependentDemo(fresh(), { ...env, RENDER_SERVICE_ID: "srv-dau9s69srm7s73bd3deg" })).toBe(false);
  expect(seedIndependentDemo(fresh(), { ...env, DEMO_CLOUD_ORIGIN: "https://cheng-tea-private-preview.onrender.com" })).toBe(false);
  expect(seedIndependentDemo(fresh(), { ...env, DEMO_COMMERCE_CLOUD: "disabled" })).toBe(false);
  expect(seedIndependentDemo(fresh(), { ...env, DEMO_FIXED_SEED: undefined })).toBe(false);
});

it("is accepted by normal order storage migration and preserves the seeded identity", async () => {
  const { createSqliteDemoOrderService } = await import("../lib/domain/demo-order-storage");
  const dir = fresh();
  seedIndependentDemo(dir, env);
  const orders = createSqliteDemoOrderService(join(dir, "orders.sqlite"));
  const target = orders.listInternalForMerchant().find(order => order.orderId === fixedSeedOrderId);
  expect(target?.orderNumber).toMatch(/^260930-\d{3}$/);
  expect(target?.total.amount).toBe(800);
  orders.close();
  const identities = new DatabaseSync(join(dir, "identities.sqlite"));
  const rows = identities.prepare("SELECT order_id, length(phone_digest) AS phone_length, length(name_digest) AS name_length FROM demo_order_identity").all();
  expect(rows).toEqual([{ order_id: fixedSeedOrderId, phone_length: 32, name_length: 32 }]);
  identities.close();
});
