import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getLocalDemoRuntime } from "@/lib/server/demo-runtime-singleton";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";

export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    return demoSuccess(getLocalDemoRuntime().placeOrder(await request.json()));
  } catch (error) { return demoFailure(error); }
}
