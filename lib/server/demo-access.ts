import { assertDemoEnabled, cloudDemoRequested } from "./demo-cloud";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const loopbackCookieName = "__Host-demo_merchant";
const lanCookieName = "demo_merchant";
const durationMs = 30 * 60 * 1000;
const context = "local-demo-merchant-v1";
const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
function cookieName(): string {
  return !cloudDemoRequested() && process.env.DEMO_COMMERCE_LAN === "enabled" ? lanCookieName : loopbackCookieName;
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
  createHmac("sha256", key).update(context).update(":").update(payload).digest("hex");

/** Caller must pass the real socket peer; headers alone do not prove locality. */
export function assertLocalDemoPost(request: Request, peerAddress: string): void {
  assertEnabled();
  if (cloudDemoRequested()) throw new Error("Local bootstrap unavailable in cloud");
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
  const supplied = /^[0-9a-fA-F]{64,}$/.test(candidate) && candidate.length % 2 === 0
    ? Buffer.from(candidate, "hex") : Buffer.alloc(0);
  if (supplied.length !== key.length || !timingSafeEqual(supplied, key)) return null;
  const payload = now + "." + randomBytes(16).toString("hex");
  const signature = mac(key, payload);
  const secure = process.env.DEMO_COMMERCE_LAN === "enabled" ? "" : " Secure;";
  return cookieName() + "=" + payload + "." + signature
    + "; HttpOnly;" + secure + " SameSite=Strict; Path=/; Max-Age=1800";
}

/** Pass Cookie header only. Duplicate names and altered signatures fail closed. */
export function verifyDemoMerchantCookie(cookieHeader: string | null, now = Date.now()): boolean {
  const key = secret();
  if (!cookieHeader || cookieHeader.length > 4096) return false;
  const expectedName = cookieName();
  const matches = cookieHeader.split(";").map(part => part.trim())
    .filter(part => part.startsWith(expectedName + "="));
  if (matches.length !== 1) return false;
  const token = matches[0]!.slice(expectedName.length + 1);
  const match = /^(\d{1,16})\.([0-9a-f]{32})\.([0-9a-f]{64})$/.exec(token);
  if (!match) return false;
  const issued = Number(match[1]);
  if (!Number.isSafeInteger(issued) || issued > now || now - issued >= durationMs) return false;
  const expected = Buffer.from(mac(key, match[1] + "." + match[2]), "hex");
  return timingSafeEqual(expected, Buffer.from(match[3]!, "hex"));
}
