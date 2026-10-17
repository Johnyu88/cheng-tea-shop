import { afterEach, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DemoRateLimitError, enforceDemoRateLimit } from "@/lib/server/demo-rate-limit";

const directories: string[] = [];
function setup() {
  const dir = mkdtempSync(join(tmpdir(), "demo-rate-"));
  directories.push(dir);
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled");
  vi.stubEnv("DEMO_DATA_DIR", dir);
}
afterEach(() => {
  vi.unstubAllEnvs();
  for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true });
});

it("limits attempts even after a new limiter call and resumes after the rolling window", () => {
  setup();
  enforceDemoRateLimit("lookup", "order:A", 2, 60_000, 100_000);
  enforceDemoRateLimit("lookup", "order:A", 2, 60_000, 100_100);
  expect(() => enforceDemoRateLimit("lookup", "order:A", 2, 60_000, 100_200)).toThrow(DemoRateLimitError);
  expect(() => enforceDemoRateLimit("lookup", "order:A", 2, 60_000, 100_200)).toThrowError("嘗試次數過多");
  enforceDemoRateLimit("lookup", "order:A", 2, 60_000, 160_001);
});

it("isolates scope and subject and stores no raw subject identifiers", async () => {
  setup();
  enforceDemoRateLimit("lookup", "order:sensitive-demo-id", 1, 60_000, 100_000);
  expect(() => enforceDemoRateLimit("lookup", "order:sensitive-demo-id", 1, 60_000, 100_001)).toThrow(DemoRateLimitError);
  enforceDemoRateLimit("lookup", "order:other", 1, 60_000, 100_001);
  enforceDemoRateLimit("otp", "order:sensitive-demo-id", 1, 60_000, 100_001);
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(join(process.env.DEMO_DATA_DIR!, "rate-limits.sqlite"), { readOnly: true });
  try {
    const stored = db.prepare("SELECT DISTINCT key_hash FROM demo_rate_attempts").all() as {key_hash:string}[];
    expect(stored).toHaveLength(3);
    expect(stored.every(row => /^[a-f0-9]{64}$/.test(row.key_hash))).toBe(true);
  } finally { db.close(); }
});
