import { describe, expect, test } from "vitest";
import { createDemoOtpService } from "@/lib/domain/demo-otp-service";

const phone = "0912000000";
const otherPhone = "0912000001";
const code = "123456";
const setup = () => {
  let now = 1_000_000;
  const service = createDemoOtpService({ now: () => now, codeFactory: () => code });
  return { service, advance: (milliseconds: number) => { now += milliseconds; } };
};

describe("isolated demo OTP service", () => {
  test("accepts only explicit synthetic numbers and never returns the code", () => {
    const { service } = setup();
    expect(() => service.issue("0912345678")).toThrow();
    expect(() => service.issue("+886912000000")).toThrow();
    const issued = service.issue(phone);
    expect(issued).toMatchObject({ delivery: "simulated", expiresAt: 1_300_000 });
    expect(JSON.stringify(issued)).not.toContain(code);
    expect(service.verify(otherPhone, issued.challengeId, code)).toBe(false);
    expect(service.verify(phone, issued.challengeId, code)).toBe(true);
  });

  test("consumes successful verification once and rejects replay", () => {
    const { service } = setup();
    const issued = service.issue(phone);
    expect(service.verify(phone, issued.challengeId, code)).toBe(true);
    expect(service.verify(phone, issued.challengeId, code)).toBe(false);
  });
  test("expires exactly at the five-minute boundary", () => {
    const { service, advance } = setup();
    const issued = service.issue(phone);
    advance(300_000);
    expect(service.verify(phone, issued.challengeId, code)).toBe(false);
  });

  test("locks challenge after five incorrect attempts", () => {
    const { service } = setup();
    const issued = service.issue(phone);
    for (let i = 0; i < 5; i++) expect(service.verify(phone, issued.challengeId, "654321")).toBe(false);
    expect(service.verify(phone, issued.challengeId, code)).toBe(false);
  });

  test("reuses the active challenge during resend cooldown", () => {
    const { service, advance } = setup();
    const first = service.issue(phone);
    expect(service.issue(phone)).toEqual(first);
    advance(60_000);
    const second = service.issue(phone);
    expect(service.verify(phone, first.challengeId, code)).toBe(false);
    expect(service.verify(phone, second.challengeId, code)).toBe(true);
  });

  test("limits sends per phone to three per rolling hour even after cooldown", () => {
    const { service, advance } = setup();
    service.issue(phone);
    advance(60_000);
    service.issue(phone);
    advance(60_000);
    service.issue(phone);
    advance(60_000);
    expect(() => service.issue(phone)).toThrow();
    advance(3_420_000);
    expect(service.issue(phone).delivery).toBe("simulated");
  });
});
