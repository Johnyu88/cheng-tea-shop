import { DatabaseSync } from "node:sqlite";
import { createDemoOrderService, taiwanOrderDate, type DemoOrderPersistence, type DemoOrderRecord, type DemoOrderService } from "./demo-order-service";

/** Durable synthetic order store. Schema migration preserves orders, digests and notifications. */
export const createSqliteDemoOrderService = (databasePath: string): DemoOrderService & { close(): void } => {
  const db = new DatabaseSync(databasePath);
  try {
    db.exec("PRAGMA busy_timeout = 10000");
    db.exec(`CREATE TABLE IF NOT EXISTS demo_orders (
      order_id TEXT PRIMARY KEY, snapshot TEXT NOT NULL, secret_digest TEXT NOT NULL, notifications TEXT NOT NULL
    )`);
    // Serialize additive migration and historical-number assignment across processes.
    db.exec("BEGIN IMMEDIATE");
    try {
      const columns = db.prepare("PRAGMA table_info(demo_orders)").all() as { name: string }[];
      if (!columns.some(column => column.name === "order_number")) db.exec("ALTER TABLE demo_orders ADD COLUMN order_number TEXT");
      db.exec("CREATE UNIQUE INDEX IF NOT EXISTS demo_orders_number_unique ON demo_orders(order_number)");
      db.exec("CREATE TABLE IF NOT EXISTS demo_order_sequences (day TEXT PRIMARY KEY, value INTEGER NOT NULL)");
      const bump = db.prepare(`INSERT INTO demo_order_sequences(day,value) VALUES(?,?)
        ON CONFLICT(day) DO UPDATE SET value = MAX(value, excluded.value)`);
      const next = db.prepare(`INSERT INTO demo_order_sequences(day,value) VALUES(?,1)
        ON CONFLICT(day) DO UPDATE SET value=value+1 RETURNING value`);
      const rows = db.prepare("SELECT order_id,snapshot,order_number FROM demo_orders ORDER BY order_id").all() as { order_id: string; snapshot: string; order_number: string | null }[];
      // Import existing valid numbers before allocating any legacy number.
      for (const row of rows) {
        const match = row.order_number?.match(/^([0-9]{6})-([0-9]+)$/);
        if (match) bump.run(match[1]!, Number(match[2]));
      }
      const update = db.prepare("UPDATE demo_orders SET order_number=?,snapshot=? WHERE order_id=?");
      for (const row of rows) {
        let snapshot: DemoOrderRecord["snapshot"];
        try { snapshot = JSON.parse(row.snapshot); } catch { continue; }
        if (!snapshot || !Array.isArray(snapshot.events) || !Array.isArray(snapshot.lines)) continue;
        if (row.order_number) {
          if (snapshot.orderNumber !== row.order_number) {
            snapshot.orderNumber = row.order_number;
            update.run(row.order_number, JSON.stringify(snapshot), row.order_id);
          }
          continue;
        }
        const parsedDate = new Date(snapshot.events[0]?.at ?? Date.now());
        const day = taiwanOrderDate(Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
        const sequence = next.get(day) as { value: number };
        snapshot.orderNumber = `${day}-${String(sequence.value).padStart(3, "0")}`;
        update.run(snapshot.orderNumber, JSON.stringify(snapshot), row.order_id);
      }
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    const read = db.prepare("SELECT snapshot, secret_digest, notifications FROM demo_orders");
    const write = db.prepare(`INSERT INTO demo_orders(order_id,order_number,snapshot,secret_digest,notifications)
      VALUES(?,?,?,?,?) ON CONFLICT(order_id) DO UPDATE SET
      snapshot=excluded.snapshot,secret_digest=excluded.secret_digest,notifications=excluded.notifications`);
    const allocate = db.prepare(`INSERT INTO demo_order_sequences(day,value) VALUES(?,1)
      ON CONFLICT(day) DO UPDATE SET value=value+1 RETURNING value`);
    const persistence: DemoOrderPersistence = {
      allocateOrderNumber(date) {
        // One atomic SQLite statement; its durable reservation survives a failed order write.
        const day = taiwanOrderDate(date); const row = allocate.get(day) as { value: number };
        return `${day}-${String(row.value).padStart(3, "0")}`;
      },
      load() {
        return (read.all() as { snapshot: string; secret_digest: string; notifications: string }[]).map(row => {
          try {
            const snapshot: DemoOrderRecord["snapshot"] = JSON.parse(row.snapshot);
            const notifications: DemoOrderRecord["notifications"] = JSON.parse(row.notifications);
            if (!snapshot || !Array.isArray(snapshot.lines) || !Array.isArray(snapshot.events) || !Array.isArray(notifications)) return null;
            return { snapshot, secretDigest: row.secret_digest, notifications };
          } catch { return null; }
        }).filter((row): row is DemoOrderRecord => row !== null);
      },
      save(record) {
        write.run(record.snapshot.orderId,record.snapshot.orderNumber ?? null,JSON.stringify(record.snapshot),
          record.secretDigest,JSON.stringify(record.notifications));
      },
    };
    return Object.assign(createDemoOrderService(persistence), { close: () => db.close() });
  } catch (error) { db.close(); throw error; }
};
