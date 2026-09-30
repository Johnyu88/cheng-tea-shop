import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { assertDemoEnabled } from "./demo-cloud";

type AuditEvent = { event: "issue" | "issue-denied" | "verify-success" | "verify-denied"; identity: string; at: number };
type Entry = { digest: Buffer; identity: string; expires: number; attempts: number; provisioning: string; code?: string };
const expiryMs = 5 * 60 * 1000;
const windowMs = 15 * 60 * 1000;
const failure = "無法完成手機驗證，請確認資料或稍後重試。";
export function merchantPhoneStatus(): { state: "ready" | "binding-pending" | "sms-pending"; simulated: boolean } {
  const bound = /^09\d{8}$/.test(process.env.DEMO_MERCHANT_PHONE ?? "")
    && process.env.DEMO_MERCHANT_PHONE_CONFIRMED === "yes";
  const simulated = process.env.DEMO_MERCHANT_SMS_MODE === "simulated";
  return { state: !bound ? "binding-pending" : !simulated ? "sms-pending" : "ready", simulated };
}
function key(): Buffer {
  assertDemoEnabled();
  const value = process.env.DEMO_MERCHANT_SECRET ?? "";
  if (!/^[a-fA-F0-9]{64}$/.test(value)) throw new Error("商家登入尚未設定");
  return Buffer.from(value, "hex");
}
function digest(value: string): Buffer { return createHmac("sha256", key()).update("merchant-otp-v1:").update(value).digest(); }
function provisioning(): string {
  return digest([process.env.DEMO_MERCHANT_PHONE, process.env.DEMO_MERCHANT_PHONE_CONFIRMED,
    process.env.DEMO_MERCHANT_SMS_MODE].join("|")).toString("hex");
}
function assertReady(): void {
  const status = merchantPhoneStatus();
  if (status.state === "binding-pending") throw new Error("尚未完成陳老師本人確認與手機綁定");
  if (status.state !== "ready") throw new Error("簡訊服務尚未啟用");
}
export function createMerchantPhoneAuth(options: { now?: () => number; audit?: (event: AuditEvent) => void } = {}) {
  const now = options.now ?? Date.now;
  const audit = options.audit ?? (() => {});
  const entries = new Map<string, Entry>();
  let start = 0, issued = 0, verified = 0, lastIssue = -Infinity;
  const housekeeping = (at: number) => {
    if (!start || at - start >= windowMs) { start = at; issued = 0; verified = 0; }
    for (const [id, entry] of entries) if (entry.expires <= at) entries.delete(id);
  };
  const record = (event: AuditEvent["event"], phone: string, at: number) =>
    audit({ event, identity: digest(phone).toString("hex"), at });
  return {
    async issue(phone: string): Promise<{ challengeId: string; expiresInSeconds: number; resendAfterSeconds: number; simulated: true }> {
      key(); assertReady();
      const at = now(); housekeeping(at);
      issued++;
      if (issued > 5 || at - lastIssue < 60000) {
        record("issue-denied", "bound-merchant", at);
        throw new Error("請稍後再傳送驗證碼");
      }
      if (!/^09\d{8}$/.test(phone) || phone !== process.env.DEMO_MERCHANT_PHONE) {
        record("issue-denied", "unknown", at); throw new Error(failure);
      }
      const challengeId = randomBytes(16).toString("hex");
      const code = randomInt(0, 1000000).toString().padStart(6, "0");
      entries.clear();
      entries.set(challengeId, { digest: digest(challengeId + ":" + code), identity: digest(phone).toString("hex"),
        expires: at + expiryMs, attempts: 0, provisioning: provisioning(), code });
      lastIssue = at; record("issue", phone, at);
      return { challengeId, expiresInSeconds: 300, resendAfterSeconds: 60, simulated: true };
    },
    verify(phone: string, challengeId: string, code: string): boolean {
      key();
      const at = now(); housekeeping(at); verified++;
      const entry = entries.get(challengeId);
      const ready = merchantPhoneStatus().state === "ready";
      if (!ready || verified > 10 || !entry || entry.attempts >= 5
        || entry.provisioning !== provisioning() || phone !== process.env.DEMO_MERCHANT_PHONE
        || !/^09\d{8}$/.test(phone) || !/^[a-f0-9]{32}$/.test(challengeId) || !/^\d{6}$/.test(code)) {
        record("verify-denied", "bound-merchant", at); return false;
      }
      entry.attempts++;
      const valid = entry.identity === digest(phone).toString("hex")
        && timingSafeEqual(entry.digest, digest(challengeId + ":" + code));
      if (valid || entry.attempts >= 5) entries.delete(challengeId);
      record(valid ? "verify-success" : "verify-denied", phone, at);
      return valid;
    },
    takeForOperator(challengeId: string, candidate: string): string | null {
      const expected = key();
      if (!/^[a-fA-F0-9]{64}$/.test(candidate) || !timingSafeEqual(expected, Buffer.from(candidate, "hex"))
        || merchantPhoneStatus().state !== "ready") return null;
      const at = now(); housekeeping(at);
      const entry = entries.get(challengeId);
      if (!entry || entry.provisioning !== provisioning()) return null;
      const code = entry.code ?? null;
      delete entry.code;
      return code;
    },
  };
}
type MerchantPhoneAuth = ReturnType<typeof createMerchantPhoneAuth>;
const globalAuth = globalThis as typeof globalThis & { merchantPhoneAuth?: MerchantPhoneAuth };
export const merchantPhoneAuth = globalAuth.merchantPhoneAuth ??= createMerchantPhoneAuth({
  audit: event => console.info(JSON.stringify({ scope: "merchant-auth", ...event })),
});
