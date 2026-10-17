import { test, expect } from "vitest";
import { createDemoOrderService, taiwanOrderDate } from "@/lib/domain/demo-order-service";
import { createSqliteDemoOrderService } from "@/lib/domain/demo-order-storage";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const cart = { lines: [{ productId: "tea", variantId: "v", productName: "tea", specification: "one", unitPrice: { currency: "TWD" as const, amount: 1 }, quantity: 1, inventoryStatus: "available" as const, maxQuantity: 1 }], subtotal: { currency: "TWD" as const, amount: 1 } };
test("Taiwan day follows midnight in Taipei", () => {
  expect(taiwanOrderDate(new Date("2026-09-30T15:59:59Z"))).toBe("260930");
  expect(taiwanOrderDate(new Date("2026-09-30T16:00:00Z"))).toBe("261001");
});
test("short number is not authorization; UUID and short number both require the secret", () => {
  const service = createDemoOrderService(); const receipt = service.create(cart);
  expect(receipt.orderNumber).toMatch(/^\d{6}-\d{3,}$/);
  expect(service.lookup(receipt.orderNumber, "")).toBeNull();
  expect(service.lookup(receipt.orderNumber, "0".repeat(64))).toBeNull();
  expect(service.lookup(receipt.orderNumber, receipt.accessSecret)).toEqual(service.lookup(receipt.orderId, receipt.accessSecret));
});
test("independent SQLite connections allocate unique durable sequences and backfill legacy without replacing secrets", () => {
  const dir = mkdtempSync(join(tmpdir(), "short-orders-")); const path = join(dir, "orders.sqlite");
  try {
    const a = createSqliteDemoOrderService(path); const b = createSqliteDemoOrderService(path);
    const receipts = Array.from({ length: 20 }, (_, i) => (i % 2 ? a : b).create(cart));
    expect(new Set(receipts.map(x => x.orderNumber)).size).toBe(20);
    a.close(); b.close();
    const db = new DatabaseSync(path);
    db.prepare("UPDATE demo_orders SET order_number = NULL, snapshot = json_remove(snapshot, '$.orderNumber') WHERE order_id = ?").run(receipts[0]!.orderId);
    db.close();
    const reopened = createSqliteDemoOrderService(path);
    const legacy = reopened.lookup(receipts[0]!.orderId, receipts[0]!.accessSecret)!;
    expect(legacy.orderNumber).toMatch(/^\d{6}-\d{3,}$/);
    expect(reopened.lookup(legacy.orderNumber!, receipts[0]!.accessSecret)).toEqual(legacy);
    expect(receipts.map(x => reopened.lookup(x.orderId, x.accessSecret)?.orderId)).toEqual(receipts.map(x => x.orderId));
    const next = reopened.create(cart); expect(receipts.map(x => x.orderNumber)).not.toContain(next.orderNumber);
    reopened.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});


test("parallel worker processes reserve distinct short numbers through the real SQLite service", async () => {
  const { transpileModule, ModuleKind, ScriptTarget } = await import("typescript");
  const { Worker } = await import("node:worker_threads");
  const dir = mkdtempSync(join(tmpdir(), "parallel-short-orders-")); const path = join(dir, "orders.sqlite");
  const compile = (source: string) => transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 } }).outputText;
  const serviceUrl = "data:text/javascript;base64," + Buffer.from(compile(readFileSync(join(process.cwd(), "lib/domain/demo-order-service.ts"), "utf8"))).toString("base64");
  const source = compile(readFileSync(join(process.cwd(), "lib/domain/demo-order-storage.ts"), "utf8")).replace('"./demo-order-service"', JSON.stringify(serviceUrl));
  const moduleUrl = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  try {
    const seed = createSqliteDemoOrderService(path); seed.close();
    const results = await Promise.all(Array.from({ length: 4 }, () => new Promise<string[]>((resolve, reject) => {
      const worker = new Worker(`const {parentPort,workerData}=require("node:worker_threads"); import(workerData.moduleUrl).then(({createSqliteDemoOrderService})=>{const s=createSqliteDemoOrderService(workerData.path);try{parentPort.postMessage(Array.from({length:20},()=>s.create(workerData.cart).orderNumber));}finally{s.close();}}).catch(e=>{throw e;});`, { eval: true, workerData: { moduleUrl, path, cart } });
      worker.once("message", resolve); worker.once("error", reject);
    })));
    expect(new Set(results.flat()).size).toBe(80);
    const reopened = createSqliteDemoOrderService(path);
    expect(reopened.listInternalForMerchant()).toHaveLength(80);
    const next = reopened.create(cart); expect(results.flat()).not.toContain(next.orderNumber);
    reopened.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
}, 15000);

test("original pre-migration schema keeps UUID, secret, packed photo and notifications", async () => {
  const { createHash } = await import("node:crypto");
  const dir = mkdtempSync(join(tmpdir(), "original-order-schema-")); const path = join(dir, "orders.sqlite");
  const memory = createDemoOrderService(); const receipt = memory.create(cart);
  memory.recordPackingPhoto(receipt.orderId, "photo-legacy");
  const notification = memory.queueNotification(receipt.orderId, "packed", "merchant");
  const snapshot = memory.lookup(receipt.orderId, receipt.accessSecret)!; delete snapshot.orderNumber;
  try {
    const db = new DatabaseSync(path);
    db.exec("CREATE TABLE demo_orders (order_id TEXT PRIMARY KEY,snapshot TEXT NOT NULL,secret_digest TEXT NOT NULL,notifications TEXT NOT NULL)");
    db.prepare("INSERT INTO demo_orders VALUES(?,?,?,?)").run(receipt.orderId, JSON.stringify(snapshot),
      createHash("sha256").update(receipt.accessSecret).digest("hex"), JSON.stringify([notification]));
    db.close();
    const migrated = createSqliteDemoOrderService(path);
    const retained = migrated.lookup(receipt.orderId, receipt.accessSecret)!;
    expect(retained).toEqual({ ...snapshot, orderNumber: expect.stringMatching(/^[0-9]{6}-[0-9]{3,}$/) });
    expect(migrated.lookup(retained.orderNumber!, receipt.accessSecret)).toEqual(retained);
    expect(migrated.listNotifications(receipt.orderId)).toEqual([notification]);
    migrated.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
