import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDemoCatalogStore } from "@/lib/server/demo-catalog-store";
import { createDemoPublishingService } from "@/lib/domain/demo-catalog-service";
import type { ProductDraft } from "@/lib/domain";

const draft = (name: string): ProductDraft => ({
  name,
  specification: "一兩",
  price: { currency: "TWD", amount: 888 },
  category: "black",
  inventoryStatus: "available",
  tasteTags: [],
});

const jsonResponse = (value: unknown, status = 200) => new Response(JSON.stringify({ ok: true, value }), {
  status,
  headers: { "content-type": "application/json" },
});

const product = (id: string, name: string) => ({
  id,
  slug: `${id}-slug`,
  name,
  category: "black" as const,
  tasteTags: [],
  summary: name,
  image: { src: null, alt: `${name}照片`, isPlaceholder: true },
  variants: [{ id: `${id}-variant`, specification: "一兩", price: { currency: "TWD" as const, amount: 888 }, inventoryStatus: "available" as const, maxQuantity: 5 }],
  publication: "draft" as const,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PRODUCT-11 persisted draft verification", () => {
  it("keeps both the 11th and 12th synthetic products across independent store instances", async () => {
    const directory = await mkdtemp(join(tmpdir(), "product-11-concurrent-"));
    try {
      const options = { filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "media"), seedProducts: [] };
      const first = createDemoCatalogStore(options);
      const second = createDemoCatalogStore(options);

      const created = await Promise.all([
        first.publish(draft("合成第11筆"), "draft"),
        second.publish(draft("合成第12筆"), "draft"),
      ]);

      const reloaded = await createDemoCatalogStore(options).list();
      expect(reloaded).toHaveLength(2);
      expect(reloaded.map((item) => item.id)).toEqual(expect.arrayContaining(created.map((item) => item.id)));
      expect(JSON.parse(await readFile(options.filePath, "utf8")).products).toHaveLength(2);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("does not report a draft save until the same-session GET confirms its ID", async () => {
    const created = product("persisted-11", "合成第11筆");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(created, 201))
      .mockResolvedValueOnce(jsonResponse({ items: [created], nextCursor: null, total: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await createDemoPublishingService().saveDraft(draft("合成第11筆"));

    expect(result).toMatchObject({ ok: true, value: { id: "persisted-11", name: "合成第11筆" } });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/demo/catalog?limit=50&includeUnpublished=true", expect.objectContaining({ credentials: "same-origin" }));
  });

  it("returns an uncertain-save error when POST succeeds but read-back fails", async () => {
    const created = product("persisted-11", "合成第11筆");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse(created, 201))
      .mockRejectedValueOnce(new Error("temporary GET failure")));

    await expect(createDemoPublishingService().saveDraft(draft("合成第11筆"))).resolves.toMatchObject({
      ok: false,
      error: { code: "publishing-unavailable", retryable: false },
    });
  });

  it("does not report success when read-back cannot find the returned ID", async () => {
    const created = product("persisted-11", "合成第11筆");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse(created, 201))
      .mockResolvedValueOnce(jsonResponse({ items: [], nextCursor: null, total: 0 })));

    await expect(createDemoPublishingService().saveDraft(draft("合成第11筆"))).resolves.toMatchObject({
      ok: false,
      error: { code: "publishing-unavailable", retryable: false },
    });
  });

  it("shows the server reason when the POST was rejected before any write", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: "商品圖片格式或大小無效。限 PNG、JPEG、WebP 且不超過 5 MB。" }), {
      status: 400,
      headers: { "content-type": "application/json", "x-demo-write-status": "not-started" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createDemoPublishingService().saveDraft(draft("合成第11筆"))).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid-draft", message: expect.stringContaining("商品未儲存：商品圖片格式或大小無效"), retryable: true },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the uncertain-save warning when the write status is not a definite rejection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: "商品已寫入，但公開同步尚未完成；請勿重複新增。" }), {
      status: 503,
      headers: { "content-type": "application/json", "x-demo-write-status": "persisted" },
    })));

    await expect(createDemoPublishingService().saveDraft(draft("合成第11筆"))).resolves.toMatchObject({
      ok: false,
      error: { code: "publishing-unavailable", message: expect.stringContaining("勿重複新增"), retryable: false },
    });
  });
});
