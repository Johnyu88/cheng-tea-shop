import { createHash, timingSafeEqual } from "node:crypto";

export const cloudDemoRequested = () => process.env.DEMO_COMMERCE_CLOUD === "enabled";
export const acerDemoRequested = () => process.env.DEMO_COMMERCE_ACER === "enabled";

export function cloudDemoOrigin(): URL {
  const raw = process.env.DEMO_CLOUD_ORIGIN || process.env.RENDER_EXTERNAL_URL;
  if (!raw) throw new Error("Cloud demo configuration is incomplete");
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port
    || url.pathname !== "/" || url.search || url.hash
    || !/^[a-z0-9][a-z0-9-]*\.onrender\.com$/.test(url.hostname)) {
    throw new Error("Cloud demo origin is invalid");
  }
  return url;
}

/** Acer staging requires one operator-configured private origin; only HTTPS :8443 may be non-default. */
export function acerDemoOrigin(): URL {
  const raw = process.env.DEMO_ACER_ORIGIN;
  if (!raw) throw new Error("Acer demo origin is not configured");
  const url = new URL(raw);
  const tailnetHost = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.){2}ts\.net$/.test(url.hostname);
  const homeArpaHost = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.home\.arpa$/.test(url.hostname);
  if (url.origin !== raw || url.protocol !== "https:" || url.username || url.password
    || (url.port && (url.port !== "8443" || !tailnetHost))
    || url.pathname !== "/" || url.search || url.hash
    || !(homeArpaHost || tailnetHost)) {
    throw new Error("Acer demo origin is invalid");
  }
  return url;
}

export function assertDemoEnabled(): void {
  if (process.release?.name !== "node") throw new Error("Demo requires Node");
  if (cloudDemoRequested()) {
    cloudDemoOrigin();
    if (acerDemoRequested() || process.env.DEMO_COMMERCE_LOCAL === "enabled" || process.env.DEMO_COMMERCE_LAN === "enabled"
      || !/^[a-f0-9]{64}$/.test(process.env.DEMO_PREVIEW_TOKEN_SHA256 ?? "")
      || !/^[a-fA-F0-9]{64}$/.test(process.env.DEMO_MERCHANT_SECRET ?? "")
      || process.env.DEMO_MERCHANT_SECRET === "11".repeat(32)) {
      throw new Error("Cloud demo configuration is incomplete");
    }
    return;
  }
  if (acerDemoRequested()) {
    acerDemoOrigin();
    if (process.env.DEMO_COMMERCE_LOCAL === "enabled" || process.env.DEMO_COMMERCE_LAN === "enabled"
      || !/^[a-f0-9]{64}$/.test(process.env.DEMO_PREVIEW_TOKEN_SHA256 ?? "")
      || !/^[a-fA-F0-9]{64}$/.test(process.env.DEMO_MERCHANT_SECRET ?? "")
      || process.env.DEMO_MERCHANT_SECRET === "11".repeat(32)) {
      throw new Error("Acer demo configuration is incomplete");
    }
    return;
  }
  if (process.env.NODE_ENV === "production" || process.env.DEMO_COMMERCE_LOCAL !== "enabled") {
    throw new Error("Local demo access is disabled");
  }
}

/** Random preview access tokens have at least 128 bits; only their SHA-256 is stored. */
export function hasCloudDemoAuthorization(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  if (header.length > 512 || !/^Basic [A-Za-z0-9+/]+=*$/.test(header)) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  if (!/^preview:[a-f0-9]{32,64}$/.test(decoded)) return false;
  const expected = process.env.DEMO_PREVIEW_TOKEN_SHA256 ?? "";
  if (!/^[a-f0-9]{64}$/.test(expected)) return false;
  const digest = createHash("sha256").update(decoded.slice(8)).digest();
  return timingSafeEqual(digest, Buffer.from(expected, "hex"));
}

export function assertCloudDemoRequest(request: Request): void {
  assertDemoEnabled();
  if (!cloudDemoRequested() || !hasCloudDemoAuthorization(request)) throw new Error("Preview access denied");
  const origin = cloudDemoOrigin();
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto");
  if (request.headers.get("host") !== origin.host
    || url.username || url.password || !["http:", "https:"].includes(url.protocol)
    || (proto ? proto !== "https" : url.protocol !== "https:")
    || request.headers.has("forwarded")
    || (request.headers.has("x-forwarded-host") && request.headers.get("x-forwarded-host") !== origin.host)) {
    throw new Error("Preview origin rejected");
  }
  const site = request.headers.get("sec-fetch-site");
  const navigation = ["GET", "HEAD"].includes(request.method)
    && request.headers.get("sec-fetch-mode") === "navigate"
    && request.headers.get("sec-fetch-dest") === "document";
  if (site && !["same-origin", "none"].includes(site) && !navigation) throw new Error("Cross-site preview request rejected");
  if (!["GET", "HEAD"].includes(request.method)
    && (request.headers.get("origin") !== origin.origin || (site && site !== "same-origin"))) {
    throw new Error("Preview origin rejected");
  }
}

export function assertAcerDemoRequest(request: Request): void {
  assertDemoEnabled();
  if (!acerDemoRequested() || (process.env.DEMO_ACER_MERCHANT_LOGIN_DIRECT !== "enabled" && !hasCloudDemoAuthorization(request))) throw new Error("Acer demo access denied");
  const origin = acerDemoOrigin();
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto");
  if (request.headers.get("host") !== origin.host || url.username || url.password
    || !["http:", "https:"].includes(url.protocol)
    || (proto ? proto !== "https" : url.protocol !== "https:")
    || request.headers.has("forwarded")
    || (request.headers.has("x-forwarded-host") && request.headers.get("x-forwarded-host") !== origin.host)) {
    throw new Error("Acer demo origin rejected");
  }
  const site = request.headers.get("sec-fetch-site");
  const navigation = ["GET", "HEAD"].includes(request.method)
    && request.headers.get("sec-fetch-mode") === "navigate"
    && request.headers.get("sec-fetch-dest") === "document";
  if (site && !["same-origin", "none"].includes(site) && !navigation) throw new Error("Cross-site Acer request rejected");
  if (!["GET", "HEAD"].includes(request.method)
    && (request.headers.get("origin") !== origin.origin || (site && site !== "same-origin"))) {
    throw new Error("Acer demo origin rejected");
  }
}
