import { merchantRequestCookie } from "@/lib/server/merchant-request-access";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";

type Context = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const { orderId } = await params;
    const body = await request.json() as { action?: unknown; notificationId?: unknown; outcome?: unknown; confirmed?: unknown; reason?: unknown };
    const runtime = getLocalDemoRuntime();
    const cookie = await merchantRequestCookie(request);
    runtime.merchant.listOrders(cookie);
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (["confirm-payment", "revoke-payment", "reopen-packing", "shipping-exception", "intercept-requested", "shipping-correction"].includes(String(body.action))
      && (!reason || reason.length > 500)) throw new Error("請填寫更正原因（最多 500 字）");
    if (body.action === "revoke-payment") return demoSuccess(runtime.merchant.revokeManualPayment(cookie, orderId, reason));
    if (body.action === "reopen-packing") return demoSuccess(runtime.merchant.reopenPacking(cookie, orderId, reason));
    if (body.action === "shipping-exception" || body.action === "intercept-requested" || body.action === "shipping-correction") {
      return demoSuccess(runtime.merchant.recordShippingIssue(cookie, orderId, body.action, reason));
    }
    if (body.action === "rotate-lookup-secret") {
      return demoSuccess(runtime.merchant.rotateLookupSecret(cookie, orderId, body.confirmed === true), { headers: { "Cache-Control": "no-store" } });
    }
    if (body.action === "confirm-payment") return demoSuccess(runtime.merchant.confirmManualPayment(cookie, orderId, reason));
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
