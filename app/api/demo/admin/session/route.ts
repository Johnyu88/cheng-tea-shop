import { issueDemoMerchantCookie, issueDemoMerchantPhoneCookie, verifyDemoMerchantCookie } from "@/lib/server/demo-access";
import { cloudDemoRequested } from "@/lib/server/demo-cloud";
import { merchantPhoneStatus } from "@/lib/server/merchant-phone-auth";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
export async function GET(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "GET");
    return demoSuccess({ ...merchantPhoneStatus(), authenticated: verifyDemoMerchantCookie(request.headers.get("cookie")) }, { headers: { "cache-control": "no-store" } });
  } catch { return demoFailure(new Error("商家登入尚未開放"), 403); }
}
export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const text = await request.text();
    if (text.length > 1024) throw new Error("Invalid request");
    const body = JSON.parse(text) as Record<string, unknown>;
    let cookie: string | null = null;
    if (typeof body.phone === "string" && typeof body.challengeId === "string" && typeof body.code === "string") {
      cookie = issueDemoMerchantPhoneCookie(body.phone, body.challengeId, body.code);
    } else if (!cloudDemoRequested() && process.env.DEMO_MERCHANT_PHONE_CONFIRMED !== "yes") {
      cookie = issueDemoMerchantCookie(typeof body.credential === "string" ? body.credential : "");
    }
    if (!cookie) throw new Error("Invalid login");
    return demoSuccess({ authenticated: true }, { headers: { "set-cookie": cookie, "cache-control": "no-store" } });
  } catch { return demoFailure(new Error("手機驗證失敗，請確認驗證碼或重新傳送。"), 403); }
}
