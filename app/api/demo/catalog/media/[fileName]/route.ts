import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getDemoCatalogStore } from "@/lib/server/demo-catalog-store";
import { demoFailure } from "@/lib/server/demo-route-response";

const contentTypes: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

export async function GET(request: Request, context: { params: Promise<{ fileName: string }> }) {
  try {
    assertLocalDemoHttpRequest(request, "GET");
    const { fileName } = await context.params;
    const media = await getDemoCatalogStore().readMedia(fileName);
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    return new Response(new Uint8Array(media), { headers: { "content-type": contentTypes[extension] ?? "application/octet-stream", "cache-control": "no-store" } });
  } catch (error) { return demoFailure(error, 404); }
}
