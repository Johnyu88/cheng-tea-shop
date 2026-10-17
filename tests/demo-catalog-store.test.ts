import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createDemoCatalogStore } from "@/lib/server/demo-catalog-store";
import type { ProductDraft } from "@/lib/domain";

const temporaryDirectories: string[] = [];
const draft: ProductDraft = {
  name: "第九種測試茶",
  specification: "一兩",
  price: { currency: "TWD", amount: 999 },
  category: "oolong",
  inventoryStatus: "available",
  tasteTags: ["sweet"],
  summary: "僅供 LAN Demo 驗證。",
};

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("demo catalog persistence", () => {
  test("seeds eight products, persists a ninth, and reloads it", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cheng-tea-catalog-"));
    temporaryDirectories.push(directory);
    const options = { filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "media") };
    const first = createDemoCatalogStore({ ...options, seedProducts: [] });
    expect(await first.list()).toHaveLength(0);
    const created = await first.publish(draft);
    expect(created.name).toBe("第九種測試茶");
    expect(JSON.parse(await readFile(options.filePath, "utf8")).products).toHaveLength(1);

    const reloaded = createDemoCatalogStore({ ...options, seedProducts: [{ ...created, name: "不應覆蓋" }] });
    await expect(reloaded.getBySlug(created.slug)).resolves.toMatchObject({ id: created.id, name: "第九種測試茶" });
  });

  test("writes an uploaded image into the demo-only media directory", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cheng-tea-catalog-media-"));
    temporaryDirectories.push(directory);
    const store = createDemoCatalogStore({ filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "media"), seedProducts: [] });
    const product = await store.publish({ ...draft, photos: [{ id: "photo-1", previewUrl: "blob:local", alt: "測試照片", dataUrl: "data:image/png;base64,iVBORw0KGgo=" }] });
    expect(product.image.src).toMatch(/^\/api\/demo\/catalog\/media\/demo-published-/);
    await expect(store.readMedia(product.image.src!.split("/").pop()!)).resolves.toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });

  test("changes publication state without deleting the product", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cheng-tea-catalog-publication-"));
    temporaryDirectories.push(directory);
    const store = createDemoCatalogStore({ filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "media"), seedProducts: [] });
    const product = await store.publish(draft);
    expect((await store.setPublication(product.id, "draft"))?.publication).toBe("draft");
    expect((await store.list()).find((item) => item.id === product.id)?.publication).toBe("draft");
  });


  test("replaces only the selected product photo, persists it, and preserves the previous photo on failure", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cheng-tea-photo-edit-"));
    temporaryDirectories.push(directory);
    const options = { filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "media"), seedProducts: [] };
    const store = createDemoCatalogStore(options);
    const target = await store.publish(draft, "draft");
    const other = await store.publish({ ...draft, name: "其他茶品" });
    const original = target.image;
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    const edited = await store.update(target.id, { imageDataUrl: dataUrl });
    expect(edited?.image.src).toMatch(/^\/api\/demo\/catalog\/media\//);
    expect(edited?.image.src).not.toBe(original.src);
    await expect(store.readMedia(edited!.image.src!.split("/").pop()!)).resolves.toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const reloaded = await createDemoCatalogStore(options).list();
    expect(reloaded.find(p => p.id === target.id)?.image).toEqual(edited?.image);
    expect(reloaded.find(p => p.id === other.id)?.image).toEqual(other.image);
    await expect(store.update(target.id, { imageDataUrl: "data:image/heic;base64,AAAA" })).rejects.toThrow("原照片已保留");
    expect((await store.list()).find(p => p.id === target.id)?.image).toEqual(edited?.image);
  });

  test("updates editable product facts without changing identity or history", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cheng-tea-catalog-edit-"));
    temporaryDirectories.push(directory);
    const store = createDemoCatalogStore({ filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "media"), seedProducts: [] });
    const product = await store.publish(draft);
    const updated = await store.update(product.id, {
      name: "第九種修訂茶",
      specification: "二兩",
      price: { currency: "TWD", amount: 1200 },
      inventoryStatus: "sold-out",
      fermentation: "輕發酵", roast: "微", brewing: "建議90度水", tasteTags: ["light", "sweet"],
      aroma: "桂花香",
      taste: "清甜回甘",
      teaRegion: "宜蘭",
      summary: "人工確認後的商品介紹。",
    });
    expect(updated).toBeDefined();
    if (!updated) throw new Error("expected updated product");
    expect(updated).toMatchObject({ id: product.id, slug: product.slug, name: "第九種修訂茶", publication: "published" });
    expect(updated.variants[0]).toMatchObject({ specification: "二兩", price: { amount: 1200 }, inventoryStatus: "sold-out" });
    expect(updated).toMatchObject({ fermentation: "輕發酵", roast: "微", brewing: "建議90度水", tasteTags: ["light", "sweet"] });
    expect((await createDemoCatalogStore({ filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "media"), seedProducts: [] }).getBySlug(product.slug))).toMatchObject({ fermentation: "輕發酵", roast: "微", brewing: "建議90度水", tasteTags: ["light", "sweet"] });
    expect(updated).toMatchObject({ aroma: "桂花香", taste: "清甜回甘", teaRegion: "宜蘭", summary: "人工確認後的商品介紹。" });
  });

  test("deletes only unpublished products and keeps published ones", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cheng-tea-catalog-delete-"));
    temporaryDirectories.push(directory);
    const options = { filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "media"), seedProducts: [] };
    const store = createDemoCatalogStore(options);
    const published = await store.publish({ ...draft, name: "上架中茶" }, "published");
    const unpublished = await store.publish({ ...draft, name: "草稿茶" }, "draft");

    await expect(store.remove(published.id)).resolves.toEqual({ status: "published" });
    await expect(store.remove("missing-id")).resolves.toEqual({ status: "not-found" });
    await expect(store.remove(unpublished.id)).resolves.toMatchObject({ status: "deleted", product: { id: unpublished.id, name: "草稿茶" } });

    const reloaded = await createDemoCatalogStore(options).list();
    expect(reloaded.map((item) => item.id)).toEqual([published.id]);
  });
});
