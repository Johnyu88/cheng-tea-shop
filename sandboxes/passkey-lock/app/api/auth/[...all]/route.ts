import { toNextJsHandler } from "better-auth/next-js";
import { getSandboxAuth } from "../../../../lib/auth.ts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return await toNextJsHandler(getSandboxAuth()).GET(request); }
  catch { return Response.json({ error: "鎖頭沙盒目前不可用" }, { status: 503 }); }
}
export async function POST(request: Request) {
  try { return await toNextJsHandler(getSandboxAuth()).POST(request); }
  catch { return Response.json({ error: "鎖頭沙盒目前不可用" }, { status: 503 }); }
}
