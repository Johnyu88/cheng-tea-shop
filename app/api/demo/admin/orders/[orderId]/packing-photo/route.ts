import { merchantRequestCookie } from "@/lib/server/merchant-request-access";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";

type Context = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "multipart");
    const { orderId } = await params;
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File)) throw new Error("請選擇包裝照片");
    const bytes = Buffer.from(await photo.arrayBuffer());
    return demoSuccess(await getLocalDemoRuntime().merchant.uploadPackingPhoto(
      await merchantRequestCookie(request), orderId, photo.type, bytes,
    ));
  } catch (error) { return demoFailure(error, 400); }
}
