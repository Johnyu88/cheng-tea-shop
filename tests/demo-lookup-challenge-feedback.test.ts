import { afterEach, expect, test, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { createDemoLookupChallenge } from "@/lib/server/demo-lookup-challenge";
import { DemoRateLimitError } from "@/lib/server/demo-rate-limit";
const dbs: DatabaseSync[] = [];
afterEach(() => { vi.useRealTimers(); dbs.splice(0).forEach(db => db.close()); });
function fixture() { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(1_000_000);
  const db = new DatabaseSync(":memory:"); dbs.push(db); return createDemoLookupChallenge(db, "123456"); }
const input = { orderId: "261002-001", customerName: "Customer", phoneLastThree: "000" };
test("receipt gives equal usable/cooldown/expiry metadata for matching and decoy identities", () => {
  const service = fixture();
  const valid = service.issue(input, "internal-order"), decoy = service.issue({ ...input, customerName: "Other" }, null);
  for (const receipt of [valid, decoy]) expect(receipt).toMatchObject({ usable: true, expiresAt: 1_300_000, resendAvailableAt: 1_060_000 });
  expect(Object.keys(valid).sort()).toEqual(Object.keys(decoy).sort());
});
test("consumed or exhausted challenge explicitly returns unusable during resend cooldown", () => {
  const service = fixture(); const receipt = service.issue(input, "internal-order");
  expect(service.verify(input, receipt.challengeId, "123456")).toBe("internal-order");
  expect(service.issue(input, "internal-order")).toMatchObject({ challengeId: receipt.challengeId, usable: false, resendAvailableAt: 1_060_000 });
  vi.setSystemTime(1_060_000); const next = service.issue(input, "internal-order");
  expect(next.usable).toBe(true);
  for (let n = 0; n < 5; n++) expect(service.verify(input, next.challengeId, "000000")).toBeNull();
  expect(service.issue(input, "internal-order").usable).toBe(false);
});
test("hourly quota returns actual Retry-After and recovers at earliest send expiry", () => {
  const service = fixture(); service.issue(input, "internal-order");
  vi.setSystemTime(1_061_000); service.issue(input, "internal-order");
  vi.setSystemTime(1_122_000); service.issue(input, "internal-order"); vi.setSystemTime(1_183_000);
  try { service.issue(input, "internal-order"); throw new Error("Expected quota"); }
  catch (error) { expect(error).toBeInstanceOf(DemoRateLimitError); expect((error as DemoRateLimitError).retryAfterSeconds).toBe(3417); }
  vi.setSystemTime(4_600_000); expect(service.issue(input, "internal-order").usable).toBe(true);
});


test("decoy usability tracks consumption without revealing whether identity matched", () => {
  const service = fixture(); const receipt = service.issue(input, null);
  expect(receipt.usable).toBe(true);
  expect(service.verify(input, receipt.challengeId, "123456")).toBeNull();
  expect(service.issue(input, null)).toMatchObject({ usable: false, resendAvailableAt: 1_060_000 });
  vi.setSystemTime(1_060_000); expect(service.issue(input, null).usable).toBe(true);
});
