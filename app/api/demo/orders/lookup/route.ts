import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
import { createDemoMobilePushPreview } from "@/lib/domain/demo-notification-preview";

export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const runtime = getLocalDemoRuntime();
    const body = await request.json();
    const order = runtime.lookupOrder(body);
    return demoSuccess({
      order,
      notifications: runtime.notifications(order.orderId).filter(item => item.audience === "customer"),
      mobilePushPreview: createDemoMobilePushPreview(order.orderId, order.status),
    });
  } catch { return demoFailure(new Error("無法驗證示範訂單，請確認訂單資料與驗證碼。"), 403); }
}
