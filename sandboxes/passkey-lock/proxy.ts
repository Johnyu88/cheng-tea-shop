import { NextResponse, type NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
/** Private sandbox entrance only; Better Auth owns all account, session, and WebAuthn verification. */
export function proxy(request: NextRequest) {
  const expected = process.env.SANDBOX_ACCESS_PASSWORD ?? "";
  const raw = request.headers.get("authorization") ?? "";
  let supplied = "";
  if (raw.length <= 1024 && /^Basic [A-Za-z0-9+/]+=*$/.test(raw)) {
    supplied = Buffer.from(raw.slice(6), "base64").toString("utf8");
  }
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (expected.length < 16 || !timingSafeEqual(digest(supplied), digest("sandbox:" + expected))) {
    return new NextResponse("Private passkey sandbox", { status: 401,
      headers: { "www-authenticate": 'Basic realm="Passkey Sandbox", charset="UTF-8"', "cache-control": "no-store" } });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
