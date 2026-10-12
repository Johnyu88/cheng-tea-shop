import { getMerchantPasskeyStore } from "@/lib/server/merchant-passkey";
import { merchantRequestCookie } from "@/lib/server/merchant-request-access";
import { issueDemoMerchantCookie, issueDemoMerchantAuthCookie } from "@/lib/server/demo-access";
import { merchantAuthStatus, providerSessionRequired } from "@/lib/server/merchant-auth-provider";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
function safeSessionFailureDiagnostic(request: Request, stage: string) {
  let configured: URL | null = null;
  try {
    const raw = process.env.DEMO_ACER_ORIGIN;
    if (raw) configured = new URL(raw);
  } catch { /* Do not include malformed configuration values in diagnostics. */ }
  const fetchSite = request.headers.get("sec-fetch-site");
  return {
    scope: "merchant-session",
    event: "login-rejected",
    status: 403,
    stage,
    method: request.method,
    hostMatchesConfiguredOrigin: configured ? request.headers.get("host") === configured.host : null,
    originMatchesConfiguredOrigin: configured ? request.headers.get("origin") === configured.origin : null,
    forwardedProtoIsHttps: request.headers.get("x-forwarded-proto") === "https",
    hasForwardedHeader: request.headers.has("forwarded"),
    hasForwardedHostHeader: request.headers.has("x-forwarded-host"),
    hasBasicAuthorizationHeader: (request.headers.get("authorization") ?? "").startsWith("Basic "),
    fetchSiteMissingOrSameOrigin: !fetchSite || fetchSite === "same-origin",
    contentTypeIsJson: /^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? ""),
  };
}

export async function GET(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "GET");
    const store = getMerchantPasskeyStore();
    const passkey = store ? await store.status() : { enabled: false, registered: false };
    return demoSuccess({ ...merchantAuthStatus(), passkey, authenticated: !!await merchantRequestCookie(request) }, { headers: { "cache-control": "no-store" } });
  } catch { return demoFailure(new Error("商家登入尚未開放"), 403); }
}
export async function POST(request: Request) {
  let stage = "request-guard";
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    stage = "body-read";
    const text = await request.text();
    if (text.length > 1024) throw new Error("Invalid request");
    stage = "body-parse";
    const body = JSON.parse(text) as Record<string, unknown>;
    stage = "auth-provider-or-session-signing";
    let cookie = issueDemoMerchantAuthCookie(body);
    if (!cookie && !providerSessionRequired() && typeof body.credential === "string") {
      cookie = issueDemoMerchantCookie(body.credential);
    }
    if (!cookie) {
      stage = "auth-provider-rejected";
      throw new Error("Invalid login");
    }
    return demoSuccess({ authenticated: true }, { headers: { "set-cookie": cookie, "cache-control": "no-store" } });
  } catch {
    console.warn(JSON.stringify(safeSessionFailureDiagnostic(request, stage)));
    return demoFailure(new Error("登入失敗，請確認資料或稍後重試。"), 403);
  }
}

export async function DELETE(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "DELETE");
    const store = getMerchantPasskeyStore();
    const vendor = store ? await store.auth.api.signOut({ headers: request.headers, asResponse: true }) : null;
    const response = demoSuccess({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
    if (vendor) for (const cookie of vendor.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
    for (const name of ["__Host-demo_merchant", "demo_merchant"]) response.headers.append("set-cookie", name + "=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
    return response;
  } catch { return demoFailure(new Error("登出失敗，請重新整理後再試"), 403); }
}
