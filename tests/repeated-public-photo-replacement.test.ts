import { afterEach, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { confirmedTeaFixture } from "@/lib/domain/mock/confirmed-tea-fixture";
import { createDemoCatalogStore } from "@/lib/server/demo-catalog-store";
import { readPublicTeaCatalog, writePublicTeaPublication } from "@/lib/server/public-tea-publication";

let folder: string | undefined;
const originalPath = process.env.PUBLIC_CATALOG_VISIBILITY_PATH;
const originalData = process.env.DEMO_DATA_DIR;
afterEach(async () => {
  if (originalPath === undefined) delete process.env.PUBLIC_CATALOG_VISIBILITY_PATH;
  else process.env.PUBLIC_CATALOG_VISIBILITY_PATH = originalPath;
  if (originalData === undefined) delete process.env.DEMO_DATA_DIR;
  else process.env.DEMO_DATA_DIR = originalData;
  if (folder) await rm(folder, { recursive: true, force: true });
  folder = undefined;
});

it("replaces a product image twice and publishes the newest photo", async () => {
  folder = await mkdtemp(join(tmpdir(), "tea-repeat-photo-"));
  process.env.DEMO_DATA_DIR = join(folder, "private");
  process.env.PUBLIC_CATALOG_VISIBILITY_PATH = join(folder, "shared", "publication.json");
  const store = createDemoCatalogStore({
    filePath: join(folder, "private", "catalog.json"),
    mediaDirectory: join(folder, "private", "catalog-media"),
  });
  const id = confirmedTeaFixture[0]!.id;
  const first = Buffer.from("first-upload").toString("base64");
  const second = Buffer.from("second-upload").toString("base64");
  await store.update(id, { imageDataUrl: "data:image/png;base64," + first });
  await writePublicTeaPublication(await store.list());
  let current = (await readPublicTeaCatalog()).find(p => p.id === id);
  const firstUrl = current?.image.src;
  expect(firstUrl).toMatch(/^\/api\/public\/media\//);
  expect(await readFile(join(folder, "shared", "media", firstUrl!.split("/").at(-1)!))).toEqual(Buffer.from("first-upload"));
  await store.update(id, { imageDataUrl: "data:image/png;base64," + second });
  await writePublicTeaPublication(await store.list());
  current = (await readPublicTeaCatalog()).find(p => p.id === id);
  expect(current?.image.src).toMatch(/^\/api\/public\/media\//);
  expect(current?.image.src).not.toBe(firstUrl);
  expect(await readFile(join(folder, "shared", "media", current!.image.src!.split("/").at(-1)!))).toEqual(Buffer.from("second-upload"));
});
