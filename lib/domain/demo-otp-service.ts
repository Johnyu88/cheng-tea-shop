import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";

const allowedPhones = new Set(["0912000000", "0912000001"]);
const lifetimeMs = 300_000;
const cooldownMs = 60_000;
const windowMs = 3_600_000;
const maxSendsPerWindow = 3;
const maxAttempts = 5;

type Challenge = {
  phone: string;
  digest: Buffer;
  salt: Buffer;
  expiresAt: number;
  attempts: number;
};
export type DemoOtpReceipt = {
  challengeId: string;
  expiresAt: number;
  delivery: "simulated";
};
export type DemoOtpService = {
  issue(phone: string): DemoOtpReceipt;
  verify(phone: string, challengeId: string, code: string): boolean;
};
type Options = {
  now?: () => number;
  /** Test-only injection. Never connect this service to a public route. */
  codeFactory?: () => string;
};
const digest = (salt: Buffer, code: string) =>
  createHash("sha256").update(salt).update(code).digest();

/** In-memory, synthetic-number-only demonstration; no SMS or external delivery. */
export function createDemoOtpService(options: Options = {}): DemoOtpService {
  const now = options.now ?? Date.now;
  const codeFactory = options.codeFactory ?? (() => randomInt(0, 1_000_000).toString().padStart(6, "0"));
  const challenges = new Map<string, Challenge>();
  const sendHistory = new Map<string, number[]>();
  return {
    issue(phone) {
      if (!allowedPhones.has(phone)) throw new Error("Only synthetic demo phones are supported");
      const at = now();
      const sends = (sendHistory.get(phone) ?? []).filter(time => time > at - windowMs);
      if (sends.length && at - sends[sends.length - 1]! < cooldownMs) {
        throw new Error("Demo OTP resend cooldown");
      }
      if (sends.length >= maxSendsPerWindow) throw new Error("Demo OTP send limit");
      const code = codeFactory();
      if (!/^\d{6}$/.test(code)) throw new Error("Invalid demo OTP generator");
      for (const [id, challenge] of challenges) {
        if (challenge.phone === phone) challenges.delete(id);
      }
      const challengeId = randomUUID();
      const salt = randomBytes(32);
      const expiresAt = at + lifetimeMs;
      challenges.set(challengeId, { phone, salt, digest: digest(salt, code), expiresAt, attempts: 0 });
      sendHistory.set(phone, [...sends, at]);
      return { challengeId, expiresAt, delivery: "simulated" };
    },
    verify(phone, challengeId, code) {
      if (!allowedPhones.has(phone)) return false;
      const challenge = challenges.get(challengeId);
      if (!challenge || challenge.phone !== phone) return false;
      if (now() >= challenge.expiresAt || challenge.attempts >= maxAttempts) {
        challenges.delete(challengeId);
        return false;
      }
      challenge.attempts++;
      const candidate = digest(challenge.salt, code);
      if (!timingSafeEqual(candidate, challenge.digest)) {
        if (challenge.attempts >= maxAttempts) challenges.delete(challengeId);
        return false;
      }
      challenges.delete(challengeId);
      return true;
    },
  };
}
