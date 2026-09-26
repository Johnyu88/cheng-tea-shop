const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

type BodyKind = "json" | "multipart";

/** Rejects requests unless the explicitly enabled demo is served directly on loopback. */
export function assertLocalDemoHttpRequest(
  request: Request,
  expectedMethod: string,
  bodyKind?: BodyKind,
) {
  if (process.env.DEMO_COMMERCE_LOCAL !== "enabled" || process.env.NODE_ENV === "production") {
    throw new Error("Local demo HTTP access is disabled");
  }

  const url = new URL(request.url);
  if (url.protocol !== "http:" || url.username || url.password
    || !LOOPBACK_HOSTS.has(url.hostname) || request.method !== expectedMethod) {
    throw new Error("Local demo HTTP request rejected");
  }

  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  let hostUrl: URL;
  let originUrl: URL | undefined;
  try {
    hostUrl = new URL(`http://${host ?? ""}`);
    originUrl = origin ? new URL(origin) : undefined;
  } catch {
    throw new Error("Local demo HTTP origin rejected");
  }
  if (!LOOPBACK_HOSTS.has(hostUrl.hostname) || hostUrl.port !== url.port
    || (expectedMethod !== "GET" && (!originUrl || originUrl.protocol !== "http:"
      || !LOOPBACK_HOSTS.has(originUrl.hostname) || originUrl.port !== hostUrl.port))) {
    throw new Error("Local demo HTTP origin rejected");
  }

  for (const header of ["forwarded"]) {
    if (request.headers.has(header)) throw new Error("Forwarded demo requests are rejected");
  }
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(forwardedFor.trim())) {
    throw new Error("Forwarded demo requests are rejected");
  }
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    let forwardedHostUrl: URL;
    try { forwardedHostUrl = new URL(`http://${forwardedHost}`); }
    catch { throw new Error("Forwarded demo requests are rejected"); }
    if (!LOOPBACK_HOSTS.has(forwardedHostUrl.hostname) || forwardedHostUrl.port !== hostUrl.port) {
      throw new Error("Forwarded demo requests are rejected");
    }
  }
  if (forwardedProto && forwardedProto !== "http") throw new Error("Forwarded demo requests are rejected");

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") throw new Error("Cross-site demo requests are rejected");

  if (bodyKind) {
    const contentType = request.headers.get("content-type") ?? "";
    const expected = bodyKind === "json" ? "application/json" : "multipart/form-data";
    if (!contentType.toLowerCase().startsWith(expected)) throw new Error("Invalid demo request content type");
  }
}
