import { issueDemoMerchantCookie } from "@/lib/server/demo-access";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";

export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const body = await request.json() as { credential?: unknown };
    const cookie = issueDemoMerchantCookie(typeof body.credential === "string" ? body.credential : "");
    if (!cookie) throw new Error("示範店家身分確認失敗");
    return demoSuccess({ authenticated: true }, { headers: { "set-cookie": cookie } });
  } catch (error) { return demoFailure(error, 403); }
}
