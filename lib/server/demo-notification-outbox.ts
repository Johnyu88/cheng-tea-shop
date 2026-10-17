import { DatabaseSync } from "node:sqlite";
import type { DemoOrderService, DemoOrderStatus, DemoNotification } from "../domain/demo-order-service";

export type DemoOutboxStatus = "queued" | "simulated-delivered" | "failed";
export type DemoOutboxPath = "order-lookup" | "simulated-email" | "merchant-inbox";
export type DemoOutboxEntry = {
  id: string;
  orderId: string;
  status: DemoOrderStatus;
  audience: "customer" | "merchant";
  path: DemoOutboxPath;
  state: DemoOutboxStatus;
  attempts: number;
  lastError: "simulation-failed" | null;
};
type Audience = DemoOutboxEntry["audience"];
type Row = {
  id: string; order_id: string; status: DemoOrderStatus; audience: Audience;
  delivery_path: DemoOutboxPath; state: DemoOutboxStatus;
  attempts: number; last_error: "simulation-failed" | null;
};
const project = (row: Row): DemoOutboxEntry => ({
  id: row.id, orderId: row.order_id, status: row.status, audience: row.audience,
  path: row.delivery_path, state: row.state, attempts: row.attempts, lastError: row.last_error,
});
/**
 * Local synthetic notification ledger. It never contacts SMS, email, or LINE.
 * Callers must authenticate order lookup / merchant access before exposing entries.
 * Order and outbox SQLite writes are separate; retry enqueue or reconcile after faults.
 */
export function createSqliteDemoNotificationOutbox(databasePath: string, orders: DemoOrderService) {
  const db = new DatabaseSync(databasePath);
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS demo_notification_outbox (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('confirmed', 'packed', 'shipped', 'delivered')),
      audience TEXT NOT NULL CHECK (audience IN ('customer', 'merchant')),
      delivery_path TEXT NOT NULL CHECK (delivery_path IN ('order-lookup', 'simulated-email', 'merchant-inbox')),
      state TEXT NOT NULL CHECK (state IN ('queued', 'simulated-delivered', 'failed')),
      attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
      last_error TEXT,
      UNIQUE(order_id, status, audience)
    )`);
    const insert = db.prepare(`INSERT INTO demo_notification_outbox
      (id, order_id, status, audience, delivery_path, state)
      VALUES (?, ?, ?, ?, ?, 'queued')
      ON CONFLICT(order_id, status, audience) DO NOTHING`);
    const byKey = db.prepare(`SELECT * FROM demo_notification_outbox
      WHERE order_id = ? AND status = ? AND audience = ?`);
    const byId = db.prepare("SELECT * FROM demo_notification_outbox WHERE id = ?");
    const byOrder = db.prepare("SELECT * FROM demo_notification_outbox WHERE order_id = ? ORDER BY rowid");
    const change = db.prepare(`UPDATE demo_notification_outbox
      SET state = ?, attempts = attempts + 1, last_error = ?
      WHERE id = ? AND state = 'queued'`);
    const retry = db.prepare(`UPDATE demo_notification_outbox
      SET state = 'queued', last_error = NULL WHERE id = ? AND state = 'failed'`);
    function get(id: string): DemoOutboxEntry | null {
      const row = byId.get(id) as Row | undefined;
      return row ? project(row) : null;
    }
    function register(note: DemoNotification, hasEmail: boolean): DemoOutboxEntry {
      const path: DemoOutboxPath = note.audience === "merchant" ? "merchant-inbox"
        : hasEmail ? "simulated-email" : "order-lookup";
      insert.run(note.id, note.orderId, note.status, note.audience, path);
      const row = byKey.get(note.orderId, note.status, note.audience) as Row | undefined;
      if (!row) throw new Error("Notification outbox registration failed");
      return project(row);
    }
    return {
      enqueue(orderId: string, status: DemoOrderStatus, audience: Audience, hasEmail = false): DemoOutboxEntry {
        // The order service checks that this event occurred and returns a stable id on retries.
        const note = orders.queueNotification(orderId, status, audience);
        return register(note, hasEmail);
      },
      reconcile(orderId: string): DemoOutboxEntry[] {
        // Repairs a failed outbox insert after the order service already recorded a notification.
        // A queueNotification failure before recording is retried with enqueue.
        return orders.listNotifications(orderId).map(note => register(note, false));
      },
      list(orderId: string): DemoOutboxEntry[] {
        return (byOrder.all(orderId) as Row[]).map(project);
      },
      get,
      simulateDelivery(id: string, outcome: "success" | "failure"): DemoOutboxEntry {
        if (outcome !== "success" && outcome !== "failure") throw new Error("Invalid simulated outcome");
        const prior = get(id);
        if (!prior) throw new Error("Unknown demo notification");
        if (prior.state !== "queued") return prior;
        change.run(outcome === "success" ? "simulated-delivered" : "failed",
          outcome === "failure" ? "simulation-failed" : null, id);
        return get(id)!;
      },
      retry(id: string): DemoOutboxEntry {
        const prior = get(id);
        if (!prior) throw new Error("Unknown demo notification");
        retry.run(id);
        return get(id)!;
      },
      close() { db.close(); },
    };
  } catch (error) {
    db.close();
    throw error;
  }
}
