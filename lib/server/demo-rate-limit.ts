import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export class DemoRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("嘗試次數過多，請稍後再試。");
    this.name = "DemoRateLimitError";
  }
}

/** Only for the private synthetic LAN demo. SQLite preserves limits across dev-server restarts. */
export function enforceDemoRateLimit(
  scope: "lookup" | "otp",
  subject: string,
  limit: number,
  periodMs: number,
  now = Date.now(),
): void {
  if (process.env.DEMO_COMMERCE_LOCAL !== "enabled" || process.env.NODE_ENV === "production") {
    throw new Error("Local demo rate limiter is unavailable");
  }
  const directory = resolve(process.env.DEMO_DATA_DIR || ".demo-data/local");
  mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(join(directory, "rate-limits.sqlite"));
  const hash = createHash("sha256").update(scope).update(":").update(subject).digest("hex");
  try {
    db.exec("CREATE TABLE IF NOT EXISTS demo_rate_attempts (key_hash TEXT NOT NULL, at_ms INTEGER NOT NULL)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_demo_rate_key_time ON demo_rate_attempts(key_hash, at_ms)");
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("DELETE FROM demo_rate_attempts WHERE key_hash = ? AND at_ms <= ?").run(hash, now - periodMs);
      const row = db.prepare("SELECT COUNT(*) AS count, MIN(at_ms) AS oldest FROM demo_rate_attempts WHERE key_hash = ?").get(hash) as { count: number; oldest: number | null };
      if (row.count >= limit) {
        db.exec("COMMIT");
        throw new DemoRateLimitError(Math.max(1, Math.ceil((row.oldest! + periodMs - now) / 1000)));
      }
      db.prepare("INSERT INTO demo_rate_attempts (key_hash, at_ms) VALUES (?, ?)").run(hash, now);
      db.exec("COMMIT");
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    db.close();
  }
}
