import { NextResponse } from "next/server";
import { readPublicTeaCatalog } from "@/lib/server/public-tea-publication";

export const dynamic = "force-dynamic";
export async function GET() {
  const items = await readPublicTeaCatalog();
  return NextResponse.json({ ok: true, value: { items, total: items.length, nextCursor: null } }, {
    headers: { "cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff" },
  });
}
