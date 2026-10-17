import { readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { NextResponse } from "next/server";

const safe = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,180}\.(?:png|jpg|jpeg|webp)$/i;
const type: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
export async function GET(_request: Request, { params }: { params: Promise<{ fileName: string }> }) {
  try {
    if (process.env.PUBLIC_STOREFRONT_SERVER !== "enabled" || !process.env.PUBLIC_CATALOG_VISIBILITY_PATH) throw Error("Unavailable");
    const { fileName } = await params;
    if (!safe.test(fileName) || basename(fileName) !== fileName) throw Error("Invalid name");
    // Serve only photos referenced by currently published products.
    const snapshot = JSON.parse(await readFile(resolve(process.env.PUBLIC_CATALOG_VISIBILITY_PATH), "utf8")) as { products?: { image?: {src?: string | null} }[] };
    if (!snapshot.products?.some(p => p.image?.src === "/api/public/media/" + fileName)) throw Error("Unpublished media");
    const bytes = await readFile(join(resolve(process.env.PUBLIC_CATALOG_VISIBILITY_PATH, ".."), "media", fileName));
    return new NextResponse(new Uint8Array(bytes), { headers: { "content-type": type[fileName.split(".").pop()!.toLowerCase()] || "application/octet-stream", "cache-control": "public, max-age=120", "x-content-type-options": "nosniff" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
