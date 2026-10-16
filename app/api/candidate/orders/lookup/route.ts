import { candidateAdapter, candidateError, candidatePhoneDigest, candidateSuccess, verifyCandidateOtp } from "@/lib/server/candidate-http";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>; verifyCandidateOtp(body);
    if (typeof body.orderId !== "string" || typeof body.phone !== "string" || typeof body.phoneLastThree !== "string" || !body.phone.endsWith(body.phoneLastThree)) throw new Error("Unable to verify candidate order");
    const order = await candidateAdapter().lookupOrder(body.orderId, candidatePhoneDigest(body.phone));
    if (!order) throw new Error("Unable to verify candidate order");
    return candidateSuccess(order);
  } catch (error) { return candidateError(error); }
}
