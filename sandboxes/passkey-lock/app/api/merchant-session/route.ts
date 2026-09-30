import { getSandboxAuth } from "../../../lib/auth.ts";
import { sandboxConfiguration } from "../../../lib/config.ts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const session = await getSandboxAuth().api.getSession({ headers: request.headers });
    return Response.json({
      authenticated: !!session,
      userId: session?.user.id ?? null,
      merchantAllowed: !!session && sandboxConfiguration().merchantUserIds.includes(session.user.id),
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ authenticated: false, userId: null, merchantAllowed: false },
      { status: 503, headers: { "cache-control": "no-store" } });
  }
}
