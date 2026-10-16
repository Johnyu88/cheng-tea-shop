import { candidateAdapter, candidateError, candidatePhoneDigest, candidateSuccess } from "@/lib/server/candidate-http";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.idempotencyKey !== "string" || typeof body.customerName !== "string" || typeof body.phone !== "string" || body.deliveryMethod !== "store-pickup" || body.paymentMethod !== "cash" || !Array.isArray(body.lines)) throw new Error("Invalid candidate order request");
    const lines = body.lines.map(line => {
      if (!line || typeof line !== "object") throw new Error("Invalid candidate line");
      const value = line as Record<string, unknown>;
      if (typeof value.productId !== "string" || typeof value.variantId !== "string" || !Number.isSafeInteger(value.quantity) || Number(value.quantity) < 1) throw new Error("Invalid candidate line");
      return { productId: value.productId, variantId: value.variantId, quantity: Number(value.quantity) };
    });
    const result = await candidateAdapter().createOrder({ idempotencyKey: body.idempotencyKey, customerName: body.customerName, phoneDigest: candidatePhoneDigest(body.phone), paymentMethod: "cash", lines });
    return candidateSuccess(result, 201);
  } catch (error) { return candidateError(error); }
}
