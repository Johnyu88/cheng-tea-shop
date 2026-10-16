import { merchantRequestCookie } from "@/lib/server/merchant-request-access";
import { candidateAdapter, candidateError, candidateSuccess } from "@/lib/server/candidate-http";

type Context = { params: Promise<{ orderId: string }> };
export async function POST(request: Request, { params }: Context) {
  try {
    if (!await merchantRequestCookie(request)) throw new Error("Candidate merchant access denied");
    const { orderId } = await params; const body = await request.json() as { action?: unknown; idempotencyKey?: unknown };
    if (typeof body.idempotencyKey !== "string" || typeof body.action !== "string") throw new Error("Invalid candidate admin request");
    const adapter = candidateAdapter(); const actor = "00000000-0000-0000-0000-000000000005";
    if (body.action === "confirm-payment") return candidateSuccess(await adapter.confirmPayment(orderId, body.idempotencyKey, actor));
    if (body.action === "ship") return candidateSuccess(await adapter.ship(orderId, body.idempotencyKey, actor));
    if (body.action === "deliver") return candidateSuccess(await adapter.deliver(orderId, body.idempotencyKey, actor));
    if (body.action === "cancel") return candidateSuccess(await adapter.cancel(orderId, body.idempotencyKey, actor));
    throw new Error("Unknown candidate admin action");
  } catch (error) { return candidateError(error); }
}
