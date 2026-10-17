import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

const digestPattern = /^[a-f0-9]{64}$/;

export function createDemoSessionRevocationStore(databasePath: string) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA busy_timeout = 5000");
  database.exec("PRAGMA synchronous = FULL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS demo_session_revocations (
      signature_hash TEXT PRIMARY KEY CHECK(length(signature_hash) = 64),
      expires_at INTEGER NOT NULL CHECK(expires_at > 0)
    ) WITHOUT ROWID;
    CREATE INDEX IF NOT EXISTS demo_session_revocations_expiry_idx
      ON demo_session_revocations(expires_at);
  `);

  const cleanupExpired = (now = Date.now()): number => {
    const result = database.prepare(
      "DELETE FROM demo_session_revocations WHERE expires_at <= ?",
    ).run(now);
    return Number(result.changes);
  };

  return {
    isRevoked(signatureHash: string, now = Date.now()): boolean {
      if (!digestPattern.test(signatureHash)) throw new Error("Invalid session digest");
      return !!database.prepare(
        "SELECT 1 FROM demo_session_revocations WHERE signature_hash = ? AND expires_at > ? LIMIT 1",
      ).get(signatureHash, now);
    },

    revoke(signatureHash: string, expiresAt: number, now = Date.now()): void {
      if (!digestPattern.test(signatureHash) || !Number.isSafeInteger(expiresAt) || expiresAt <= now) {
        throw new Error("Invalid session revocation record");
      }

      let transaction = false;
      try {
        database.exec("BEGIN IMMEDIATE");
        transaction = true;
        cleanupExpired(now);
        database.prepare(
          "INSERT INTO demo_session_revocations(signature_hash, expires_at) VALUES (?, ?) " +
          "ON CONFLICT(signature_hash) DO UPDATE SET expires_at = MAX(expires_at, excluded.expires_at)",
        ).run(signatureHash, expiresAt);
        database.exec("COMMIT");
        transaction = false;
      } catch (error) {
        if (transaction) {
          try { database.exec("ROLLBACK"); } catch { /* Preserve the original storage error. */ }
        }
        throw error;
      }
    },

    cleanupExpired,
    close(): void { database.close(); },
  };
}
