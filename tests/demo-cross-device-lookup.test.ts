import { afterEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocalDemoRuntime } from "@/lib/server/demo-runtime";
const folders: string[] = [];
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); folders.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });
function fixture() {
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled"); vi.stubEnv("DEMO_MERCHANT_SECRET", "a".repeat(64));
  const directory = mkdtempSync(join(tmpdir(), "cross-lookup-")); folders.push(directory);
  const runtime = createLocalDemoRuntime({ directory });
  const create = (name: string) => {
    const otp = runtime.issueOtp("0912000000", "checkout");
    return runtime.placeOrder({ phone: "0912000000", challengeId: otp.challengeId, code: "123456",
      draft: { name, phone: "0912000000", deliveryMethod: "store-pickup", paymentMethod: "cash" },
      lines: [{ productId: "mock-tea-001", variantId: "mock-tea-001-variant", quantity: 1 }] });
  };
  return { runtime, create, directory };
}
test("cross-device lookup needs only number/name/suffix and a single-use bound OTP", () => {
  const f = fixture(); try {
    const order = f.create("Cross Device"); const input = { orderId: order.orderNumber, customerName: "Cross Device", phoneLastThree: "000" };
    const challenge = f.runtime.issueLookupOtp(input);
    expect(Object.keys(challenge).sort()).toEqual(["challengeId", "delivery", "expiresAt", "resendAvailableAt", "usable"]);
    const verified = { ...input, challengeId: challenge.challengeId, code: "123456" };
    expect(f.runtime.lookupOrder(verified)).toMatchObject({ orderId: order.orderId });
    expect(() => f.runtime.lookupOrder(verified)).toThrow("Unable to verify demo order");
  } finally { f.runtime.close(); }
});
test("invalid identities get indistinguishable decoys that never authorize", () => {
  const f = fixture(); try {
    const order = f.create("Cross Device");
    for (const change of [{ customerName: "Wrong" }, { phoneLastThree: "999" }, { orderId: "999999-999" }]) {
      const input = { orderId: order.orderNumber, customerName: "Cross Device", phoneLastThree: "000", ...change };
      const challenge = f.runtime.issueLookupOtp(input);
      expect(Object.keys(challenge).sort()).toEqual(["challengeId", "delivery", "expiresAt", "resendAvailableAt", "usable"]);
      expect(() => f.runtime.lookupOrder({ ...input, challengeId: challenge.challengeId, code: "123456" })).toThrow("Unable to verify demo order");
    }
  } finally { f.runtime.close(); }
});
test("OTP cannot be moved to another order or identity, expires and locks after five failures", () => {
  vi.useFakeTimers({ toFake: ["Date"] }); const f = fixture(); try {
    const order = f.create("Cross Device"); const input = { orderId: order.orderNumber, customerName: "Cross Device", phoneLastThree: "000" };
    const challenge = f.runtime.issueLookupOtp(input);
    expect(() => f.runtime.lookupOrder({ ...input, orderId: "999999-999", challengeId: challenge.challengeId, code: "123456" })).toThrow();
    for (let n = 0; n < 4; n++) expect(() => f.runtime.lookupOrder({ ...input, challengeId: challenge.challengeId, code: "000000" })).toThrow();
    expect(() => f.runtime.lookupOrder({ ...input, challengeId: challenge.challengeId, code: "123456" })).toThrow();
    vi.setSystemTime(Date.now() + 61_000);
    const next = f.runtime.issueLookupOtp(input); vi.setSystemTime(Date.now() + 300_000);
    expect(() => f.runtime.lookupOrder({ ...input, challengeId: next.challengeId, code: "123456" })).toThrow();
  } finally { f.runtime.close(); }
});
test("pending lookup binding and attempt limits survive runtime restart", () => {
  const f = fixture(); const order = f.create("Cross Device");
  const input = { orderId: order.orderNumber, customerName: "Cross Device", phoneLastThree: "000" };
  const challenge = f.runtime.issueLookupOtp(input); f.runtime.close();
  const reopened = createLocalDemoRuntime({ directory: f.directory }); try {
    expect(reopened.lookupOrder({ ...input, challengeId: challenge.challengeId, code: "123456" })).toMatchObject({ orderId: order.orderId });
  } finally { reopened.close(); }
});

test("two orders on the same phone have independent challenges and cannot exchange OTP bindings", () => {
  vi.useFakeTimers({ toFake: ["Date"] }); const f = fixture(); try {
    const first = f.create("Cross Device"); vi.setSystemTime(Date.now() + 61_000);
    const second = f.create("Cross Device");
    const a = { orderId: first.orderNumber, customerName: "Cross Device", phoneLastThree: "000" };
    const b = { ...a, orderId: second.orderNumber };
    const ca = f.runtime.issueLookupOtp(a), cb = f.runtime.issueLookupOtp(b);
    expect(ca.challengeId).not.toBe(cb.challengeId);
    expect(() => f.runtime.lookupOrder({ ...b, challengeId: ca.challengeId, code: "123456" })).toThrow();
    expect(f.runtime.lookupOrder({ ...b, challengeId: cb.challengeId, code: "123456" })).toMatchObject({ orderId: second.orderId });
    expect(f.runtime.lookupOrder({ ...a, challengeId: ca.challengeId, code: "123456" })).toMatchObject({ orderId: first.orderId });
  } finally { f.runtime.close(); }
});
test("resend returns same challenge during cooldown and invalidates older challenge afterward", () => {
  vi.useFakeTimers({ toFake: ["Date"] }); const f = fixture(); try {
    const order = f.create("Cross Device"), input = { orderId: order.orderNumber, customerName: "Cross Device", phoneLastThree: "000" };
    const first = f.runtime.issueLookupOtp(input);
    expect(f.runtime.issueLookupOtp(input)).toEqual(first);
    vi.setSystemTime(Date.now() + 61_000); const next = f.runtime.issueLookupOtp(input);
    expect(next.challengeId).not.toBe(first.challengeId);
    expect(() => f.runtime.lookupOrder({ ...input, challengeId: first.challengeId, code: "123456" })).toThrow();
    expect(f.runtime.lookupOrder({ ...input, challengeId: next.challengeId, code: "123456" })).toMatchObject({ orderId: order.orderId });
  } finally { f.runtime.close(); }
});
test("lookup send quota and exhausted attempts remain enforced after restart", () => {
  vi.useFakeTimers({ toFake: ["Date"] }); const f = fixture(); const order = f.create("Cross Device");
  const input = { orderId: order.orderNumber, customerName: "Cross Device", phoneLastThree: "000" };
  let challenge = f.runtime.issueLookupOtp(input);
  for (let n = 0; n < 5; n++) expect(() => f.runtime.lookupOrder({ ...input, challengeId: challenge.challengeId, code: "000000" })).toThrow();
  for (let n = 0; n < 2; n++) { vi.setSystemTime(Date.now() + 61_000); challenge = f.runtime.issueLookupOtp(input); }
  f.runtime.close(); const reopened = createLocalDemoRuntime({ directory: f.directory }); try {
    for (let n = 0; n < 5; n++) expect(() => reopened.lookupOrder({ ...input, challengeId: challenge.challengeId, code: "000000" })).toThrow();
    vi.setSystemTime(Date.now() + 61_000);
    expect(() => reopened.issueLookupOtp(input)).toThrow("嘗試次數過多");
    expect(() => reopened.lookupOrder({ ...input, challengeId: challenge.challengeId, code: "123456" })).toThrow();
  } finally { reopened.close(); }
});

test("failed OTP attempts persist through runtime restart and the hour quota expires", () => {
  vi.useFakeTimers({ toFake: ["Date"] }); const f = fixture(); const order = f.create("Cross Device");
  const input = { orderId: order.orderNumber, customerName: "Cross Device", phoneLastThree: "000" };
  const first = f.runtime.issueLookupOtp(input);
  for (let n = 0; n < 4; n++) expect(() => f.runtime.lookupOrder({ ...input, challengeId: first.challengeId, code: "000000" })).toThrow();
  f.runtime.close(); const reopened = createLocalDemoRuntime({ directory: f.directory }); try {
    expect(() => reopened.lookupOrder({ ...input, challengeId: first.challengeId, code: "000000" })).toThrow();
    expect(() => reopened.lookupOrder({ ...input, challengeId: first.challengeId, code: "123456" })).toThrow();
    vi.setSystemTime(Date.now() + 61_000); reopened.issueLookupOtp(input);
    vi.setSystemTime(Date.now() + 61_000); reopened.issueLookupOtp(input);
    vi.setSystemTime(Date.now() + 61_000); expect(() => reopened.issueLookupOtp(input)).toThrow();
    vi.setSystemTime(Date.now() + 3_600_001); const next = reopened.issueLookupOtp(input);
    expect(reopened.lookupOrder({ ...input, challengeId: next.challengeId, code: "123456" })).toMatchObject({ orderId: order.orderId });
  } finally { reopened.close(); }
});
