import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { assertDemoEnabled, cloudDemoOrigin, cloudDemoRequested } from "./demo-cloud";
import { merchantPhoneAuth, merchantPhoneStatus } from "./merchant-phone-auth";

export type MerchantAuthInput = { password?: unknown; phone?: unknown; challengeId?: unknown; code?: unknown };
export type MerchantAuthStatus = { provider: "password" | "sms"; state: "ready" | "password-pending" | "binding-pending" | "sms-pending"; simulated: boolean };
export interface MerchantAuthProvider {
  status(): MerchantAuthStatus;
  verify(input: MerchantAuthInput): boolean;
  sessionContext(): string;
}
const passwordOrigin = "https://cheng-tea-password-demo.onrender.com";
const lockMs = 15 * 60 * 1000;
function serverKey(): Buffer {
  const raw = process.env.DEMO_MERCHANT_SECRET ?? "";
  if (!/^[a-fA-F0-9]{64}$/.test(raw)) throw new Error("商家登入設定不可用");
  return Buffer.from(raw, "hex");
}
const keyedDigest = (value: string) => createHmac("sha256", serverKey()).update(value).digest();
let cachedPassword: { fingerprint: string; hash: Buffer; salt: Buffer } | undefined;
function passwordConfiguration(): typeof cachedPassword {
  try {
    assertDemoEnabled();
    const value = process.env.DEMO_AUTH_PASSWORD ?? "";
    if (!cloudDemoRequested() || process.env.DEMO_AUTH_ENV !== "isolated-demo"
      || cloudDemoOrigin().origin !== passwordOrigin || value.length < 3 || Buffer.byteLength(value) > 128
      || value === process.env.DEMO_MERCHANT_SECRET) return undefined;
    const fingerprint = keyedDigest("password-config:" + value).toString("hex");
    if (cachedPassword?.fingerprint !== fingerprint) {
      const salt = keyedDigest("merchant-password-scrypt-salt-v1");
      cachedPassword = { fingerprint, salt, hash: scryptSync(value, salt, 32) };
    }
    return cachedPassword;
  } catch { return undefined; }
}
export function createPasswordAuthProvider(options: { now?: () => number } = {}): MerchantAuthProvider {
  const now = options.now ?? Date.now;
  let lastAttempt = -Infinity, firstFailure = -Infinity, failures = 0, lockedUntil = 0;
  return {
    status: () => ({ provider: "password", state: passwordConfiguration() ? "ready" : "password-pending", simulated: false }),
    verify(input) {
      const configuration = passwordConfiguration();
      if (!configuration) return false;
      const at = now();
      if (at < lockedUntil || at - lastAttempt < 1000) return false;
      lastAttempt = at;
      if (at - firstFailure >= lockMs) { failures = 0; firstFailure = at; }
      const candidate = typeof input.password === "string" && Buffer.byteLength(input.password) <= 128
        ? input.password : "";
      const valid = timingSafeEqual(configuration.hash, scryptSync(candidate, configuration.salt, 32));
      if (!valid) { failures++; if (failures >= 5) lockedUntil = at + lockMs; }
      else { failures = 0; firstFailure = at; }
      console.info(JSON.stringify({ scope: "merchant-auth", provider: "password", event: valid ? "verify-success" : "verify-denied", at }));
      return valid;
    },
    sessionContext() {
      const configuration = passwordConfiguration();
      return configuration ? ["merchant-password-session-v1", configuration.fingerprint,
        process.env.DEMO_AUTH_ENV, cloudDemoOrigin().origin].join("|") : "password-disabled";
    },
  };
}
const smsProvider: MerchantAuthProvider = {
  status: () => ({ provider: "sms", ...merchantPhoneStatus() }),
  verify(input) {
    return typeof input.phone === "string" && typeof input.challengeId === "string" && typeof input.code === "string"
      && merchantPhoneAuth.verify(input.phone, input.challengeId, input.code);
  },
  sessionContext: () => ["merchant-phone-session-v1", process.env.DEMO_MERCHANT_PHONE,
    process.env.DEMO_MERCHANT_PHONE_CONFIRMED, process.env.DEMO_MERCHANT_SMS_MODE,
    process.env.DEMO_CLOUD_ORIGIN || process.env.RENDER_EXTERNAL_URL || "local"].join("|"),
};
const disabledProvider: MerchantAuthProvider = {
  status: () => ({ provider: "sms", state: "sms-pending", simulated: false }),
  verify: () => false,
  sessionContext: () => "merchant-auth-disabled",
};
const globalProviders = globalThis as typeof globalThis & { merchantPasswordProvider?: MerchantAuthProvider };
const passwordProvider = globalProviders.merchantPasswordProvider ??= createPasswordAuthProvider();
/** Both credential providers hand off to the same signed session and authorization layer. */
export function getMerchantAuthProvider(): MerchantAuthProvider {
  const configured = process.env.DEMO_AUTH_PROVIDER;
  if (configured === "password") return passwordProvider;
  if (!configured || configured === "sms") return smsProvider;
  return disabledProvider;
}
export const merchantAuthStatus = (): MerchantAuthStatus => getMerchantAuthProvider().status();
export const merchantAuthSessionContext = (): string => getMerchantAuthProvider().sessionContext();
export const providerSessionRequired = () => cloudDemoRequested() || !!process.env.DEMO_AUTH_PROVIDER
  || process.env.DEMO_MERCHANT_PHONE_CONFIRMED === "yes";


export type AuthProvider = MerchantAuthProvider;
export const DemoPasswordProvider: AuthProvider = passwordProvider;
export const SmsOtpProvider: AuthProvider = smsProvider;
