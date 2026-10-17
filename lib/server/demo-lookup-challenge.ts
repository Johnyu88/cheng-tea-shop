import { DemoRateLimitError } from "./demo-rate-limit";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
export type LookupIdentity = { orderId: string; customerName: string; phoneLastThree: string };
type ChallengeRow = { id: string; binding: string; order_id: string | null; salt: string; code_digest: string; issued_at: number; expires_at: number; attempts: number; consumed: number };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const equal = (a: string, b: string) => /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b) && timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
const binding = (input: LookupIdentity) => hash(JSON.stringify([input.orderId.trim(), input.customerName.trim().normalize("NFC"), input.phoneLastThree]));
/** Private synthetic demo only. The fixed test code is not a real SMS authenticator. */
export function createDemoLookupChallenge(db: DatabaseSync, code: string) {
  db.exec("CREATE TABLE IF NOT EXISTS demo_lookup_challenge (id TEXT PRIMARY KEY, binding TEXT NOT NULL, order_id TEXT, salt TEXT NOT NULL, code_digest TEXT NOT NULL, issued_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, consumed INTEGER NOT NULL DEFAULT 0)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_demo_lookup_binding ON demo_lookup_challenge(binding, issued_at)");
  const receipt = (row: Pick<ChallengeRow, "id" | "expires_at" | "issued_at" | "consumed" | "attempts">) => ({
    challengeId: row.id, expiresAt: row.expires_at, resendAvailableAt: row.issued_at + 60_000,
    usable: !row.consumed && row.attempts < 5 && Date.now() < row.expires_at, delivery: "simulated" as const,
  });
  return {
    issue(input: LookupIdentity, orderId: string | null) {
      const key = binding(input); const now = Date.now();
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare("DELETE FROM demo_lookup_challenge WHERE issued_at <= ?").run(now - 3_600_000);
        const rows = db.prepare("SELECT * FROM demo_lookup_challenge WHERE binding = ? ORDER BY issued_at DESC").all(key) as ChallengeRow[];
        const latest = rows[0];
        if (latest && now - latest.issued_at < 60_000) {
          // Public state describes usability only, never whether an order identity matched.
          db.exec("COMMIT"); return receipt(latest);
        }
        if (rows.length >= 3) throw new DemoRateLimitError(Math.max(1, Math.ceil((rows[rows.length - 1]!.issued_at + 3_600_000 - now) / 1000)));
        db.prepare("UPDATE demo_lookup_challenge SET consumed = 1 WHERE binding = ?").run(key);
        const id = randomUUID(), salt = randomBytes(32).toString("hex"), expiresAt = now + 300_000;
        db.prepare("INSERT INTO demo_lookup_challenge (id,binding,order_id,salt,code_digest,issued_at,expires_at) VALUES (?,?,?,?,?,?,?)")
          .run(id, key, orderId, salt, hash(salt + code), now, expiresAt);
        db.exec("COMMIT"); return receipt({ id, expires_at: expiresAt, issued_at: now, consumed: 0, attempts: 0 });
      } catch (error) { if (db.isTransaction) db.exec("ROLLBACK"); throw error; }
    },
    verify(input: LookupIdentity, challengeId: string, code: string): string | null {
      db.exec("BEGIN IMMEDIATE");
      try {
        const row = db.prepare("SELECT * FROM demo_lookup_challenge WHERE id = ?").get(challengeId) as ChallengeRow | undefined;
        if (!row || row.consumed || row.attempts >= 5 || Date.now() >= row.expires_at) { db.exec("COMMIT"); return null; }
        const valid = equal(row.binding, binding(input)) && equal(row.code_digest, hash(row.salt + code));
        db.prepare("UPDATE demo_lookup_challenge SET attempts = attempts + 1, consumed = ? WHERE id = ?")
          .run(valid || row.attempts + 1 >= 5 ? 1 : 0, challengeId);
        db.exec("COMMIT"); return valid ? row.order_id : null;
      } catch (error) { if (db.isTransaction) db.exec("ROLLBACK"); throw error; }
    },
  };
}
