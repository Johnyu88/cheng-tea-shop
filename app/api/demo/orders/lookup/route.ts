import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
import { createDemoMobilePushPreview } from "@/lib/domain/demo-notification-preview";
import { DemoRateLimitError, enforceDemoRateLimit } from "@/lib/server/demo-rate-limit";

export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const runtime = getLocalDemoRuntime();
    const body = await request.json() as { orderId?: unknown; phone?: unknown };
    enforceDemoRateLimit("lookup", "lan-global", 40, 15 * 60_000);
    enforceDemoRateLimit("lookup", "order:" + String(body.orderId), 5, 15 * 60_000);
    enforceDemoRateLimit("lookup", "phone:" + String(body.phone), 5, 15 * 60_000);
    const order = runtime.lookupOrder(body as Parameters<typeof runtime.lookupOrder>[0]);
    return demoSuccess({
      order,
      notifications: runtime.notifications(order.orderId).filter(item => item.audience === "customer"),
      mobilePushPreview: createDemoMobilePushPreview(order.orderId, order.status),
    });
  } catch (error) {
    if (error instanceof DemoRateLimitError) return Response.json({ ok: false, error: error.message }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    return demoFailure(new Error("無法驗證示範訂單，請確認訂單資料與驗證碼。"), 403);
  }
}
