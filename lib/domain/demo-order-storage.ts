import { DatabaseSync } from "node:sqlite";
import {
  createDemoOrderService,
  type DemoOrderPersistence,
  type DemoOrderRecord,
  type DemoOrderService,
} from "./demo-order-service";

/**
 * Local, synthetic persistence only. The file owner must protect this database;
 * no HTTP route or shop/admin authorization is provided here.
 */
export const createSqliteDemoOrderService = (
  databasePath: string,
): DemoOrderService & { close(): void } => {
  const db = new DatabaseSync(databasePath);
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS demo_orders (
      order_id TEXT PRIMARY KEY,
      snapshot TEXT NOT NULL,
      secret_digest TEXT NOT NULL,
      notifications TEXT NOT NULL
    )`);
    const read = db.prepare("SELECT snapshot, secret_digest, notifications FROM demo_orders");
    const write = db.prepare(`INSERT INTO demo_orders (order_id, snapshot, secret_digest, notifications)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(order_id) DO UPDATE SET snapshot=excluded.snapshot,
        secret_digest=excluded.secret_digest, notifications=excluded.notifications`);
    const persistence: DemoOrderPersistence = {
      load() {
        return (read.all() as { snapshot: string; secret_digest: string; notifications: string }[])
          .map(row => {
            try {
              const snapshot: DemoOrderRecord["snapshot"] = JSON.parse(row.snapshot);
              const notifications: DemoOrderRecord["notifications"] = JSON.parse(row.notifications);
              if (!snapshot || !Array.isArray(snapshot.lines) || !Array.isArray(snapshot.events)
                || !Array.isArray(notifications)) return null;
              return { snapshot, secretDigest: row.secret_digest, notifications };
            } catch {
              // Damaged records are excluded rather than granting lookup.
              return null;
            }
          }).filter((row): row is DemoOrderRecord => row !== null);
      },
      save(record) {
        write.run(record.snapshot.orderId, JSON.stringify(record.snapshot),
          record.secretDigest, JSON.stringify(record.notifications));
      },
    };
    return Object.assign(createDemoOrderService(persistence), { close: () => db.close() });
  } catch (error) {
    db.close();
    throw error;
  }
};
