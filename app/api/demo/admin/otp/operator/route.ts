import { merchantPhoneAuth } from "@/lib/server/merchant-phone-auth";
import { getMerchantAuthProvider, SmsOtpProvider } from "@/lib/server/merchant-auth-provider";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
/** Private operator transport for simulated SMS only. Never called by the browser login UI. */
export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    if (getMerchantAuthProvider() !== SmsOtpProvider) throw new Error("SMS login is not selected");
    const text = await request.text();
    if (text.length > 128) throw new Error("Invalid request");
    const body = JSON.parse(text) as { challengeId?: unknown };
    if (typeof body.challengeId !== "string" || !/^[a-f0-9]{32}$/.test(body.challengeId)) throw new Error("Invalid challenge");
    const code = merchantPhoneAuth.takeForOperator(body.challengeId, request.headers.get("x-demo-merchant-operator") ?? "");
    if (!code) throw new Error("Access denied");
    return demoSuccess({ code, simulated: true }, { headers: { "cache-control": "no-store" } });
  } catch { return demoFailure(new Error("操作員收件匣不可用"), 403); }
}
