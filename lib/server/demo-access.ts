import { acerDemoRequested, assertDemoEnabled, cloudDemoRequested } from "./demo-cloud";
import { getMerchantAuthProvider, merchantAuthSessionContext, merchantAuthStatus, providerSessionRequired, type MerchantAuthInput } from "./merchant-auth-provider";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { join, resolve } from "node:path";
import { createDemoSessionRevocationStore } from "./demo-session-revocation";

const loopbackCookieName = "__Host-demo_merchant";
const lanCookieName = "demo_merchant";
const durationMs = 30 * 60 * 1000;
const context = "local-demo-merchant-v1";
const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
function cookieName(): string {
  return !cloudDemoRequested() && !acerDemoRequested() && process.env.DEMO_COMMERCE_LAN === "enabled" ? lanCookieName : loopbackCookieName;
}
function assertEnabled(): void {
  assertDemoEnabled();
}
function secret(): Buffer {
  assertEnabled();
  const value = process.env.DEMO_MERCHANT_SECRET;
  if (!value || !/^[0-9a-fA-F]{64,}$/.test(value) || value.length % 2 !== 0) {
    throw new Error("Missing high-entropy demo merchant credential");
  }
  return Buffer.from(value, "hex");
}
const mac = (key: Buffer, payload: string) =>
  createHmac("sha256", key).update(providerSessionRequired() ? merchantAuthSessionContext() : context)
    .update(":").update(payload).digest("hex");

/** Caller must pass the real socket peer; headers alone do not prove locality. */
export function assertLocalDemoPost(request: Request, peerAddress: string): void {
  assertEnabled();
  if (cloudDemoRequested() || acerDemoRequested()) throw new Error("Local bootstrap unavailable in hosted demo");
  const url = new URL(request.url);
  if (!loopback.has(peerAddress) || !loopback.has(url.hostname)
    || url.protocol !== "http:" || url.username || url.password
    || request.method !== "POST" || request.headers.get("host") !== url.host
    || request.headers.get("origin") !== url.origin
    || request.headers.get("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin"
    || ["forwarded", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto"]
      .some(name => request.headers.has(name))
    || !/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    throw new Error("Untrusted local demo request");
  }
}
/** The independent merchant credential is never stored in a cookie. */
export function issueDemoMerchantCookie(candidate: string, now = Date.now()): string | null {
  const key = secret();
  if (providerSessionRequired()) return null;
  const supplied = /^[0-9a-fA-F]{64,}$/.test(candidate) && candidate.length % 2 === 0
    ? Buffer.from(candidate, "hex") : Buffer.alloc(0);
  if (supplied.length !== key.length || !timingSafeEqual(supplied, key)) return null;
  return signCookie(now);
}

export function issueDemoMerchantAuthCookie(input: MerchantAuthInput): string | null {
  if (!getMerchantAuthProvider().verify(input)) return null;
  return signCookie(Date.now());
}
export function issueDemoMerchantPhoneCookie(phone: string, challengeId: string, code: string): string | null {
  if (merchantAuthStatus().provider !== "sms") return null;
  return issueDemoMerchantAuthCookie({ phone, challengeId, code });
}
function signCookie(now: number): string {
  const key = secret();
  const payload = now + "." + randomBytes(16).toString("hex");
  const signature = mac(key, payload);
  const secure = !cloudDemoRequested() && !acerDemoRequested() && process.env.DEMO_COMMERCE_LAN === "enabled" ? "" : " Secure;";
  return cookieName() + "=" + payload + "." + signature
    + "; HttpOnly;" + secure + " SameSite=Strict; Path=/; Max-Age=1800";
}

type ParsedDemoCookie = { signatureHash: string; expiresAt: number };
function withDemoSessionRevocationStore<T>(operation: (store: ReturnType<typeof createDemoSessionRevocationStore>) => T): T {
  const databasePath = join(resolve(/*turbopackIgnore: true*/ process.env.DEMO_DATA_DIR || ".demo-data/local"), "merchant-auth.sqlite");
  const store = createDemoSessionRevocationStore(databasePath);
  try {
    return operation(store);
  } finally {
    store.close();
  }
}

function parseValidDemoCookie(cookieHeader: string | null, now = Date.now()): ParsedDemoCookie | null {
  const key = secret();
  if (providerSessionRequired() && merchantAuthStatus().state !== "ready") return null;
  if (!cookieHeader || cookieHeader.length > 4096) return null;
  const expectedName = cookieName();
  const matches = cookieHeader.split(";").map(part => part.trim())
    .filter(part => part.startsWith(expectedName + "="));
  if (matches.length !== 1) return null;
  const token = matches[0]!.slice(expectedName.length + 1);
  const match = /^(\d{1,16})\.([0-9a-f]{32})\.([0-9a-f]{64})$/.exec(token);
  if (!match) return null;
  const issued = Number(match[1]);
  if (!Number.isSafeInteger(issued) || issued > now || now - issued >= durationMs) return null;
  const expected = Buffer.from(mac(key, match[1] + "." + match[2]), "hex");
  const signature = Buffer.from(match[3]!, "hex");
  if (!timingSafeEqual(expected, signature)) return null;
  return {
    signatureHash: createHash("sha256").update(match[3]!).digest("hex"),
    expiresAt: issued + durationMs,
  };
}

/** Pass Cookie header only. Duplicate names, altered signatures, storage errors, and revoked sessions fail closed. */
export function verifyDemoMerchantCookie(cookieHeader: string | null, now = Date.now()): boolean {
  const parsed = parseValidDemoCookie(cookieHeader, now);
  if (!parsed) return false;
  try {
    return withDemoSessionRevocationStore(store => !store.isRevoked(parsed.signatureHash, now));
  } catch {
    return false;
  }
}

/** Persist revocation before returning success from logout; storage errors propagate to the route. */
export function revokeDemoMerchantCookie(cookieHeader: string | null, now = Date.now()): boolean {
  const parsed = parseValidDemoCookie(cookieHeader, now);
  if (!parsed) return false;
  withDemoSessionRevocationStore(store => store.revoke(parsed.signatureHash, parsed.expiresAt, now));
  return true;
}

/** Server-only transient adapter, used only after live vendor authorization. Never return it to a client. */
export function issueVerifiedMerchantBridgeCookie(): string { return signCookie(Date.now()); }
