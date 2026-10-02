import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getMerchantPasskeyStore } from "@/lib/server/merchant-passkey";
const open = new Set(["/passkey/generate-authenticate-options", "/passkey/verify-authentication", "/get-session", "/sign-out"]);
const protectedPaths = new Set(["/passkey/generate-register-options", "/passkey/verify-registration", "/passkey/list-user-passkeys", "/passkey/delete-passkey", "/passkey/update-passkey"]);
async function handle(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, request.method, request.method === "POST" ? "json" : undefined);
    const store = getMerchantPasskeyStore(); if (!store) throw new Error("Disabled");
    const path = new URL(request.url).pathname.slice("/api/auth".length);
    if (!open.has(path) && !protectedPaths.has(path)) return Response.json({ error: "Not available" }, { status: 404 });
    await store.prepare();
    if (protectedPaths.has(path) && !await store.authorized(request.headers)) throw new Error("Merchant denied");
    return store.auth.handler(request);
  } catch { return Response.json({ error: "Merchant authentication denied" }, { status: 403 }); }
}
export const GET = handle;
export const POST = handle;
