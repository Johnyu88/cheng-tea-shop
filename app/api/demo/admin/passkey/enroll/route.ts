import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { verifyDemoMerchantCookie } from "@/lib/server/demo-access";
import { getMerchantAuthProvider } from "@/lib/server/merchant-auth-provider";
import { getMerchantPasskeyStore } from "@/lib/server/merchant-passkey";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const text = await request.text(); if (text.length > 1024) throw new Error("Invalid request");
    const body = JSON.parse(text) as { password?: unknown };
    if (!verifyDemoMerchantCookie(request.headers.get("cookie")) && !getMerchantAuthProvider().verify(body)) throw new Error("Merchant setup denied");
    const store = getMerchantPasskeyStore(); if (!store) throw new Error("Passkey disabled");
    const vendor = await store.enroll(); if (!vendor.ok) throw new Error("Merchant setup denied");
    const response = demoSuccess({ authenticated: true }, { headers: { "Cache-Control": "no-store" } });
    for (const cookie of vendor.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
    return response;
  } catch (error) { return demoFailure(new Error("首次設定失敗，請確認後台密碼後再試", { cause: error }), 403); }
}
