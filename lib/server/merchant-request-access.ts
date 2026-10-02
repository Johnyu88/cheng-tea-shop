import { verifyDemoMerchantCookie, issueVerifiedMerchantBridgeCookie } from "./demo-access";
import { getMerchantPasskeyStore } from "./merchant-passkey";
/** Never sends a bridge cookie to the browser. Every vendor request rechecks the live DB session. */
export async function merchantRequestCookie(request: Request): Promise<string | null> {
  const cookie = request.headers.get("cookie");
  if (verifyDemoMerchantCookie(cookie)) return cookie;
  const store = getMerchantPasskeyStore();
  if (store && await store.authorized(request.headers)) return issueVerifiedMerchantBridgeCookie().split(";")[0]!;
  return null;
}

