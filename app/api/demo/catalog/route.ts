import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getDemoCatalogStore } from "@/lib/server/demo-catalog-store";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
import { validateProductDraftDto } from "@/lib/domain";
import type { CatalogQuery, ProductDraft, TeaCategory, TasteTag } from "@/lib/domain";

export async function GET(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "GET");
    const url = new URL(request.url);
    const query: CatalogQuery = {};
    const category = url.searchParams.get("category");
    const taste = url.searchParams.get("taste");
    if (category) query.category = category as TeaCategory;
    if (taste) query.taste = taste as TasteTag;
    const all = await getDemoCatalogStore().list();
    const filtered = all.filter((product) => (query.category === undefined || product.category === query.category) && (query.taste === undefined || product.tasteTags.includes(query.taste)));
    const start = Number.parseInt(url.searchParams.get("cursor") ?? "0", 10);
    const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 1), 50);
    const safeStart = Number.isInteger(start) && start >= 0 ? start : 0;
    const items = filtered.slice(safeStart, safeStart + limit);
    return demoSuccess({ items, nextCursor: safeStart + items.length < filtered.length ? String(safeStart + items.length) : null, total: filtered.length });
  } catch (error) { return demoFailure(error); }
}

export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const validated = validateProductDraftDto(await request.json());
    if (!validated.ok) return demoFailure(new Error(validated.error.message));
    const product = await getDemoCatalogStore().publish(validated.value as ProductDraft);
    return demoSuccess(product, { status: 201 });
  } catch (error) { return demoFailure(error); }
}
