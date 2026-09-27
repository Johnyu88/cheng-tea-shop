import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getDemoCatalogStore, type ProductUpdate } from "@/lib/server/demo-catalog-store";
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
    const includeUnpublished = url.searchParams.get("includeUnpublished") === "true";
    const filtered = all.filter((product) => (includeUnpublished || product.publication === "published") && (query.category === undefined || product.category === query.category) && (query.taste === undefined || product.tasteTags.includes(query.taste)));
    const start = Number.parseInt(url.searchParams.get("cursor") ?? "0", 10);
    const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 1), 50);
    const safeStart = Number.isInteger(start) && start >= 0 ? start : 0;
    const items = filtered.slice(safeStart, safeStart + limit);
    return demoSuccess({ items, nextCursor: safeStart + items.length < filtered.length ? String(safeStart + items.length) : null, total: filtered.length });
  } catch (error) { return demoFailure(error); }
}

export async function PATCH(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "PATCH", "json");
    const body = await request.json() as { id?: unknown; publication?: unknown; name?: unknown; category?: unknown; specification?: unknown; price?: unknown; inventoryStatus?: unknown; aroma?: unknown; taste?: unknown; teaRegion?: unknown; summary?: unknown; imageDataUrl?: unknown };
    if (typeof body.id !== "string") throw new Error("商品更新資料無效");
    if (body.publication === "draft" || body.publication === "published") {
      const product = await getDemoCatalogStore().setPublication(body.id, body.publication);
      if (!product) throw new Error("找不到商品");
      return demoSuccess(product);
    }
    const changes: ProductUpdate = {};
    if (typeof body.name === "string") changes.name = body.name;
    if (typeof body.category === "string") changes.category = body.category as TeaCategory;
    if (typeof body.specification === "string") changes.specification = body.specification;
    if (body.price && typeof body.price === "object") changes.price = body.price as { currency: "TWD"; amount: number };
    if (body.inventoryStatus === "available" || body.inventoryStatus === "sold-out") changes.inventoryStatus = body.inventoryStatus;
    if (typeof body.aroma === "string") changes.aroma = body.aroma;
    if (typeof body.taste === "string") changes.taste = body.taste;
    if (typeof body.teaRegion === "string") changes.teaRegion = body.teaRegion;
    if (body.imageDataUrl !== undefined) {
      if (typeof body.imageDataUrl !== "string") throw new Error("商品照片資料無效");
      changes.imageDataUrl = body.imageDataUrl;
    }
    if (typeof body.summary === "string") changes.summary = body.summary;
    if (Object.keys(changes).length === 0) throw new Error("商品編輯資料無效");
    const product = await getDemoCatalogStore().update(body.id, changes);
    if (!product) throw new Error("找不到商品");
    return demoSuccess(product);
  } catch (error) { return demoFailure(error); }
}

export async function POST(request: Request) {
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    const publication = new URL(request.url).searchParams.get("publication") === "draft" ? "draft" : "published";
    const validated = validateProductDraftDto(await request.json());
    if (!validated.ok) return demoFailure(new Error(validated.error.message));
    const product = await getDemoCatalogStore().publish(validated.value as ProductDraft, publication);
    return demoSuccess(product, { status: 201 });
  } catch (error) { return demoFailure(error); }
}
