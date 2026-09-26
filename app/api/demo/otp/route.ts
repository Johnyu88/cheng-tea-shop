import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";

export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const body = await request.json() as { phone?: unknown; purpose?: unknown };
    const challenge = getLocalDemoRuntime().issueOtp(body.phone, body.purpose as "checkout" | "lookup");
    return demoSuccess({ ...challenge, demoCode: "123456" });
  } catch (error) { return demoFailure(error); }
}
