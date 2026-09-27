import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
import { DemoRateLimitError, enforceDemoRateLimit } from "@/lib/server/demo-rate-limit";

export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const body = await request.json() as { phone?: unknown; purpose?: unknown };
    if (body.purpose === "lookup") {
      enforceDemoRateLimit("otp", "lan-global", 15, 15 * 60_000);
      enforceDemoRateLimit("otp", "phone:" + String(body.phone), 3, 15 * 60_000);
    }
    const challenge = getLocalDemoRuntime().issueOtp(body.phone, body.purpose as "checkout" | "lookup");
    return demoSuccess({ ...challenge, demoCode: "123456" });
  } catch (error) {
    if (error instanceof DemoRateLimitError) return Response.json({ ok: false, error: error.message }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    return demoFailure(error);
  }
}
