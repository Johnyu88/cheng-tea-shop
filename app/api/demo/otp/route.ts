import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
import { DemoRateLimitError, enforceDemoRateLimit } from "@/lib/server/demo-rate-limit";

export async function POST(request: Request) {
  let lookup = false;
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const body = await request.json() as { phone?: unknown; purpose?: unknown; orderId?: unknown; customerName?: unknown; phoneLastThree?: unknown };
    lookup = body.purpose === "lookup";
    if (lookup) {
      enforceDemoRateLimit("otp", "lan-global", 15, 15 * 60_000);
      if (body.orderId !== undefined) {
        enforceDemoRateLimit("otp", "order:" + String(body.orderId).trim(), 3, 15 * 60_000);
        enforceDemoRateLimit("otp", "suffix:" + String(body.phoneLastThree), 3, 15 * 60_000);
        const challenge = getLocalDemoRuntime().issueLookupOtp(body as Parameters<ReturnType<typeof getLocalDemoRuntime>["issueLookupOtp"]>[0]);
        return demoSuccess({ ...challenge, demoCode: "123456" });
      }
      enforceDemoRateLimit("otp", "phone:" + String(body.phone), 3, 15 * 60_000);
    }
    const challenge = getLocalDemoRuntime().issueOtp(body.phone, body.purpose as "checkout" | "lookup");
    return demoSuccess({ ...challenge, demoCode: "123456" });
  } catch (error) {
    if (error instanceof DemoRateLimitError) return Response.json({ ok: false, error: error.message }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    return demoFailure(lookup ? new Error("無法發送驗證碼，請稍後再試") : error);
  }
}
