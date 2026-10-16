import { merchantRequestCookie } from "@/lib/server/merchant-request-access";
import { candidateAdapter, candidateError, candidateSuccess } from "@/lib/server/candidate-http";

type Context = { params: Promise<{ orderId: string }> };
export async function POST(request: Request, { params }: Context) {
  try {
    if (!await merchantRequestCookie(request)) throw new Error("Candidate merchant access denied");
    if (process.env.CLOUD02_TEST_PHOTO_STORAGE !== "1") throw new Error("Candidate object storage is not configured");
    const { orderId } = await params;
    let idempotencyKey = "photo"; let fileName = "packing-photo.jpg";
    if (process.env.CLOUD02_TEST_PHOTO_STORAGE === "1" && request.headers.get("content-type")?.startsWith("application/json")) {
      const body = await request.json() as { idempotencyKey?: unknown; fileName?: unknown };
      if (typeof body.idempotencyKey === "string") idempotencyKey = body.idempotencyKey;
      if (typeof body.fileName === "string") fileName = body.fileName;
    } else {
      const form = await request.formData(); const photo = form.get("photo");
      if (!(photo instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) throw new Error("Invalid candidate packing photo");
      if (typeof form.get("idempotencyKey") === "string") idempotencyKey = String(form.get("idempotencyKey")); fileName = photo.name;
    }
    const result = await candidateAdapter().attachPackingPhoto(orderId, idempotencyKey, "00000000-0000-0000-0000-000000000005", `test-double/${orderId}/${fileName}`);
    return candidateSuccess({ ...result, storage: "test-double", realObjectStorage: false });
  } catch (error) { return candidateError(error); }
}
