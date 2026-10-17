import { merchantPhoneAuth } from "@/lib/server/merchant-phone-auth";
import { getMerchantAuthProvider, SmsOtpProvider } from "@/lib/server/merchant-auth-provider";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    if (getMerchantAuthProvider() !== SmsOtpProvider) throw new Error("SMS login is not selected");
    const text = await request.text();
    if (text.length > 256) throw new Error("Invalid request");
    const body = JSON.parse(text) as { phone?: unknown };
    if (typeof body.phone !== "string" || !/^09\d{8}$/.test(body.phone)) throw new Error("Invalid phone");
    return demoSuccess(await merchantPhoneAuth.issue(body.phone), { headers: { "cache-control": "no-store" } });
  } catch (error) { return demoFailure(new Error("無法傳送驗證碼。請確認本人綁定、簡訊設定，並稍後重試。", { cause: error }), 403); }
}
