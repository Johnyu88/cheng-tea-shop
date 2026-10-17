import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createDemoSessionRevocationStore } from "@/lib/server/demo-session-revocation";

let directory = "";
let databasePath = "";
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "tea-session-revocation-"));
  databasePath = join(directory, "merchant-auth.sqlite");
});
afterEach(() => {
  if (directory) rmSync(directory, { recursive: true, force: true });
  directory = "";
});

describe("persistent Demo Session revocation", () => {
  test("a revoked signature is denied by another connection and after reopening the database", () => {
    const now = 1_900_000_000_000;
    const signatureHash = "a".repeat(64);
    const first = createDemoSessionRevocationStore(databasePath);
    const second = createDemoSessionRevocationStore(databasePath);

    first.revoke(signatureHash, now + 30 * 60 * 1000, now);
    expect(second.isRevoked(signatureHash, now + 1)).toBe(true);

    second.close();
    const restarted = createDemoSessionRevocationStore(databasePath);
    expect(restarted.isRevoked(signatureHash, now + 2)).toBe(true);
    restarted.close();
    first.close();
  });

  test("a failed durable insert throws instead of reporting revocation", () => {
    const store = createDemoSessionRevocationStore(databasePath);
    const blocker = new DatabaseSync(databasePath);
    blocker.exec("CREATE TRIGGER deny_demo_revocation BEFORE INSERT ON demo_session_revocations BEGIN SELECT RAISE(ABORT, 'blocked'); END");

    expect(() => store.revoke("b".repeat(64), Date.now() + 60_000)).toThrow();
    expect(store.isRevoked("b".repeat(64))).toBe(false);

    blocker.exec("DROP TRIGGER deny_demo_revocation");
    blocker.close();
    store.close();
  });

  test("expired revocation rows are deleted while active rows remain", () => {
    const store = createDemoSessionRevocationStore(databasePath);
    const now = 1_900_000_000_000;
    store.revoke("c".repeat(64), now - 1, now - 2);
    store.revoke("d".repeat(64), now + 60_000, now - 2);

    expect(store.cleanupExpired(now)).toBe(1);
    expect(store.isRevoked("c".repeat(64), now)).toBe(false);
    expect(store.isRevoked("d".repeat(64), now)).toBe(true);
    store.close();
  });

  test("the database stores only a fixed-length signature digest and expiry", () => {
    const store = createDemoSessionRevocationStore(databasePath);
    const signatureHash = "e".repeat(64);
    store.revoke(signatureHash, Date.now() + 60_000);
    const db = new DatabaseSync(databasePath);
    const columns = db.prepare("PRAGMA table_info(demo_session_revocations)").all() as Array<{ name: string }>;
    const rows = db.prepare("SELECT signature_hash, expires_at FROM demo_session_revocations").all() as Array<{ signature_hash: string; expires_at: number }>;

    expect(columns.map(column => column.name).sort()).toEqual(["expires_at", "signature_hash"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.signature_hash).toBe(signatureHash);
    expect(Number.isInteger(rows[0]?.expires_at)).toBe(true);

    db.close();
    store.close();
  });
});
