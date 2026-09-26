import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";

export function GET(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "GET");
    const runtime = getLocalDemoRuntime();
    const cookie = request.headers.get("cookie");
    const orders = runtime.merchant.listOrders(cookie);
    return demoSuccess(orders.map(order => ({ order, notifications: runtime.notifications(order.orderId) })));
  } catch (error) { return demoFailure(error, 403); }
}
