import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
import { createDemoMobilePushPreview } from "@/lib/domain/demo-notification-preview";
import { DemoRateLimitError, enforceDemoRateLimit } from "@/lib/server/demo-rate-limit";

export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const runtime = getLocalDemoRuntime();
    const body = await request.json() as { orderId?: unknown; phone?: unknown; phoneLastThree?: unknown };
    enforceDemoRateLimit("lookup", "lan-global", 40, 15 * 60_000);
    enforceDemoRateLimit("lookup", "order:" + String(body.orderId).trim(), 5, 15 * 60_000);
    enforceDemoRateLimit("lookup", body.phone === undefined ? "suffix:" + String(body.phoneLastThree) : "phone:" + String(body.phone), 5, 15 * 60_000);
    const order = runtime.lookupOrder(body as Parameters<typeof runtime.lookupOrder>[0]);
    return demoSuccess({
      order,
      notifications: runtime.notifications(order.orderId).filter(item => item.audience === "customer").map(item => ({ ...item, orderId: order.orderNumber ?? order.orderId })),
      mobilePushPreview: createDemoMobilePushPreview(order.orderNumber ?? order.orderId, order.status),
    });
  } catch (error) {
    if (error instanceof DemoRateLimitError) return Response.json({ ok: false, error: error.message }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    return demoFailure(new Error("查無符合資料的訂單，或驗證碼無效／過期，請確認訂單編號、姓名及手機末三碼後再試", { cause: error }), 403);
  }
}
