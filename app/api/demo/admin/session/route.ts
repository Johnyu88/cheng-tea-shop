import { issueDemoMerchantCookie, issueDemoMerchantAuthCookie, verifyDemoMerchantCookie } from "@/lib/server/demo-access";
import { merchantAuthStatus, providerSessionRequired } from "@/lib/server/merchant-auth-provider";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
export async function GET(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "GET");
    return demoSuccess({ ...merchantAuthStatus(), authenticated: verifyDemoMerchantCookie(request.headers.get("cookie")) }, { headers: { "cache-control": "no-store" } });
  } catch { return demoFailure(new Error("商家登入尚未開放"), 403); }
}
export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const text = await request.text();
    if (text.length > 1024) throw new Error("Invalid request");
    const body = JSON.parse(text) as Record<string, unknown>;
    let cookie = issueDemoMerchantAuthCookie(body);
    if (!cookie && !providerSessionRequired() && typeof body.credential === "string") {
      cookie = issueDemoMerchantCookie(body.credential);
    }
    if (!cookie) throw new Error("Invalid login");
    return demoSuccess({ authenticated: true }, { headers: { "set-cookie": cookie, "cache-control": "no-store" } });
  } catch { return demoFailure(new Error("登入失敗，請確認資料或稍後重試。"), 403); }
}
