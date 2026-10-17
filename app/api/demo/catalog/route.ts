import { randomUUID } from "node:crypto";
import { merchantRequestCookie } from "@/lib/server/merchant-request-access";
import { writePublicTeaPublication } from "@/lib/server/public-tea-publication";

import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";
import { getDemoCatalogStore, type ProductUpdate } from "@/lib/server/demo-catalog-store";
import { demoFailure, demoSuccess } from "@/lib/server/demo-route-response";
import { validateProductDraftDto } from "@/lib/domain";
import type { CatalogQuery, ProductDraft, TeaCategory, TasteTag } from "@/lib/domain";

const instanceId = process.env.HOSTNAME || "unknown";
const requestIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const diagnosticHeaders = (requestId: string, extra: Record<string, string> = {}) => ({
  "cache-control": "private, no-store",
  "x-demo-request-id": requestId,
  "x-demo-instance-id": instanceId,
  ...extra,
});

const report = (event: Record<string, string>) => {
  try { console.info(JSON.stringify({ scope: "demo-catalog", ...event })); } catch { /* Diagnostics must not change request behavior. */ }
};
const beginDiagnostic = (request: Request, method: string) => {
  const inbound = request.headers.get("x-demo-request-id")?.trim() ?? "";
  const requestId = requestIdPattern.test(inbound) ? inbound : randomUUID();
  const diagnostic = { requestId, instanceId, startedAt: Date.now() };
  report({ event: "received", requestId, instanceId, method });
  return diagnostic;
};
const finishDiagnostic = (diagnostic: ReturnType<typeof beginDiagnostic>, method: string, httpStatus: number, writeStatus: string, syncStatus: string) => {
  report({ event: "completed", requestId: diagnostic.requestId, instanceId: diagnostic.instanceId, method, httpStatus: String(httpStatus), durationMs: String(Math.max(0, Date.now() - diagnostic.startedAt)), writeStatus, syncStatus });
};

export async function GET(request: Request) {
  const diagnostic = beginDiagnostic(request, "GET");
  let httpStatus = 200;
  const writeStatus = "not-applicable";
  const syncStatus = "not-applicable";
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
    if (includeUnpublished && !await merchantRequestCookie(request)) throw new Error("Merchant access required");
    const filtered = all.filter((product) => (includeUnpublished || product.publication === "published") && (query.category === undefined || product.category === query.category) && (query.taste === undefined || product.tasteTags.includes(query.taste)));
    const start = Number.parseInt(url.searchParams.get("cursor") ?? "0", 10);
    const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 1), 50);
    const safeStart = Number.isInteger(start) && start >= 0 ? start : 0;
    const items = filtered.slice(safeStart, safeStart + limit);
    return demoSuccess({ items, nextCursor: safeStart + items.length < filtered.length ? String(safeStart + items.length) : null, total: filtered.length }, { headers: diagnosticHeaders(diagnostic.requestId) });
  } catch (error) { httpStatus = 400; return demoFailure(error, httpStatus, { headers: diagnosticHeaders(diagnostic.requestId, { "x-demo-write-status": writeStatus }) }); }
  finally { finishDiagnostic(diagnostic, "GET", httpStatus, writeStatus, syncStatus); }
}

export async function PATCH(request: Request) {
  const diagnostic = beginDiagnostic(request, "PATCH");
  let httpStatus = 200;
  let writeStatus = "not-started";
  let syncStatus = "not-started";
  try {
    assertLocalDemoHttpRequest(request, "PATCH", "json");
    if (!await merchantRequestCookie(request)) throw new Error("Merchant access required");
    const body = await request.json() as { id?: unknown; publication?: unknown; name?: unknown; category?: unknown; specification?: unknown; price?: unknown; inventoryStatus?: unknown; aroma?: unknown; taste?: unknown; teaRegion?: unknown; summary?: unknown; fermentation?: unknown; roast?: unknown; brewing?: unknown; tasteTags?: unknown; imageDataUrl?: unknown };
    if (typeof body.id !== "string") throw new Error("商品更新資料無效");
    if (body.publication === "draft" || body.publication === "published") {
      const product = await getDemoCatalogStore().setPublication(body.id, body.publication);
      if (!product) throw new Error("找不到商品");
      writeStatus = "persisted";
      syncStatus = "started";
      await writePublicTeaPublication(await getDemoCatalogStore().list());
      syncStatus = "completed";
      return demoSuccess(product, { headers: diagnosticHeaders(diagnostic.requestId, { "x-demo-write-status": writeStatus, "x-demo-sync-status": syncStatus }) });
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
    if (typeof body.fermentation === "string") changes.fermentation = body.fermentation;
    if (typeof body.roast === "string") changes.roast = body.roast;
    if (typeof body.brewing === "string") changes.brewing = body.brewing;
    if (body.tasteTags !== undefined) {
      const allowed = ["light", "sweet", "rich", "roasted"];
      if (!Array.isArray(body.tasteTags) || body.tasteTags.some((tag) => typeof tag !== "string" || !allowed.includes(tag))) throw new Error("口感標籤無效");
      changes.tasteTags = body.tasteTags as TasteTag[];
    }
    if (typeof body.summary === "string") changes.summary = body.summary;
    if (Object.keys(changes).length === 0) throw new Error("商品編輯資料無效");
    const product = await getDemoCatalogStore().update(body.id, changes);
    if (!product) throw new Error("找不到商品");
    writeStatus = "persisted";
    syncStatus = "started";
    await writePublicTeaPublication(await getDemoCatalogStore().list());
    syncStatus = "completed";
    return demoSuccess(product, { headers: diagnosticHeaders(diagnostic.requestId, { "x-demo-write-status": writeStatus, "x-demo-sync-status": syncStatus }) });
  } catch (error) { httpStatus = 400; if (writeStatus === "persisted") syncStatus = "failed"; return demoFailure(error, httpStatus, { headers: diagnosticHeaders(diagnostic.requestId, { "x-demo-write-status": writeStatus, "x-demo-sync-status": syncStatus }) }); }
  finally { finishDiagnostic(diagnostic, "PATCH", httpStatus, writeStatus, syncStatus); }
}

export async function POST(request: Request) {
  const diagnostic = beginDiagnostic(request, "POST");
  let httpStatus = 201;
  let writeStatus = "not-started";
  let syncStatus = "not-started";
  try {
    assertLocalDemoHttpRequest(request, "POST", "json");
    if (!await merchantRequestCookie(request)) throw new Error("Merchant access required");
    const publication = new URL(request.url).searchParams.get("publication") === "draft" ? "draft" : "published";
    const validated = validateProductDraftDto(await request.json());
    if (!validated.ok) { httpStatus = 400; return demoFailure(new Error(validated.error.message), httpStatus, { headers: diagnosticHeaders(diagnostic.requestId, { "x-demo-write-status": writeStatus, "x-demo-sync-status": syncStatus }) });
    }
    const product = await getDemoCatalogStore().publish(validated.value as ProductDraft, publication);
    writeStatus = "persisted";
    syncStatus = "started";
    try {
      await writePublicTeaPublication(await getDemoCatalogStore().list());
    } catch {
      httpStatus = 503;
      syncStatus = "failed";
      return demoFailure(new Error("商品已寫入，但公開同步尚未完成；請勿重複新增。"), httpStatus, { headers: diagnosticHeaders(diagnostic.requestId, { "x-demo-write-status": writeStatus, "x-demo-sync-status": syncStatus }) });
    }
    syncStatus = "completed";
    return demoSuccess(product, { status: httpStatus, headers: diagnosticHeaders(diagnostic.requestId, { "x-demo-write-status": writeStatus, "x-demo-sync-status": syncStatus }) });
  } catch (error) { httpStatus = 400; return demoFailure(error, httpStatus, { headers: diagnosticHeaders(diagnostic.requestId, { "x-demo-write-status": writeStatus, "x-demo-sync-status": syncStatus }) }); }
  finally { finishDiagnostic(diagnostic, "POST", httpStatus, writeStatus, syncStatus); }
}
