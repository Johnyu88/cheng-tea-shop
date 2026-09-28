import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";

type Context = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const { orderId } = await params;
    const body = await request.json() as { action?: unknown; notificationId?: unknown; outcome?: unknown; confirmed?: unknown };
    const runtime = getLocalDemoRuntime();
    const cookie = request.headers.get("cookie");
    runtime.merchant.listOrders(cookie);
    if (body.action === "rotate-lookup-secret") {
      return demoSuccess(runtime.merchant.rotateLookupSecret(cookie, orderId, body.confirmed === true));
    }
    if (body.action === "confirm-payment") return demoSuccess(runtime.merchant.confirmSimulatedPayment(cookie, orderId));
    if (body.action === "ship") return demoSuccess(runtime.merchant.markShipped(cookie, orderId));
    if (body.action === "deliver") return demoSuccess(runtime.merchant.markDelivered(cookie, orderId));
    if (body.action === "simulate-notification" && typeof body.notificationId === "string"
      && (body.outcome === "success" || body.outcome === "failure")) {
      return demoSuccess(runtime.outbox.simulateDelivery(body.notificationId, body.outcome));
    }
    if (body.action === "retry-notification" && typeof body.notificationId === "string") {
      return demoSuccess(runtime.outbox.retry(body.notificationId));
    }
    throw new Error("未知的示範訂單操作");
  } catch (error) { return demoFailure(error, 400); }
}
