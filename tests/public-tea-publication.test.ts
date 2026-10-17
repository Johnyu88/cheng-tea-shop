import { afterEach, expect, it } from "vitest";
import { mkdtemp, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { confirmedTeaFixture } from "@/lib/domain/mock/confirmed-tea-fixture";
import { readPublicTeaCatalog, writePublicTeaPublication } from "@/lib/server/public-tea-publication";

const original = process.env.PUBLIC_CATALOG_VISIBILITY_PATH;
const originalDataDir = process.env.DEMO_DATA_DIR;
let directory: string | undefined;
afterEach(async () => {
  if (original === undefined) delete process.env.PUBLIC_CATALOG_VISIBILITY_PATH;
  else process.env.PUBLIC_CATALOG_VISIBILITY_PATH = original;
  if (originalDataDir === undefined) delete process.env.DEMO_DATA_DIR;
  else process.env.DEMO_DATA_DIR = originalDataDir;
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = undefined;
});

it("shares merchant publication state without exposing merchant data", async () => {
  directory = await mkdtemp(join(tmpdir(), "tea-publish-"));
  process.env.PUBLIC_CATALOG_VISIBILITY_PATH = join(directory, "status.json");
  expect(await readPublicTeaCatalog()).toEqual([]);
  await writePublicTeaPublication(confirmedTeaFixture);
  expect((await readPublicTeaCatalog()).length).toBe(8);
  const hidden = confirmedTeaFixture.map((p, i) => ({ ...p, publication: i === 0 ? "draft" as const : p.publication }));
  await writePublicTeaPublication(hidden);
  const list = await readPublicTeaCatalog();
  expect(list).toHaveLength(7);
  expect(list.some(p => p.id === confirmedTeaFixture[0]?.id)).toBe(false);
  const payload = JSON.parse(await readFile(process.env.PUBLIC_CATALOG_VISIBILITY_PATH, "utf8"));
  expect(payload.publication[confirmedTeaFixture[0]!.id]).toBe("draft");
  expect(JSON.stringify(payload)).not.toContain("phone");
  expect(payload.products[0].variants[0].price.amount).toBeGreaterThan(0);
  expect(JSON.stringify(payload)).not.toContain("inventoryQuantity");
  expect(JSON.stringify(payload)).not.toContain("packageWeight");
  await writePublicTeaPublication(confirmedTeaFixture);
  expect((await readPublicTeaCatalog()).length).toBe(8);
});

it("publishes new products and copied photos, never a draft photo", async () => {
  directory = await mkdtemp(join(tmpdir(), "tea-product-media-"));
  process.env.PUBLIC_CATALOG_VISIBILITY_PATH = join(directory, "publication.json");
  process.env.DEMO_DATA_DIR = join(directory, "private-data");
  await mkdir(join(directory, "private-data", "catalog-media"), { recursive: true });
  const fileName = "demo-published-test-photo.png";
  const photoBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLkGQAAAABJRU5ErkJggg==", "base64");
  await writeFile(join(directory, "private-data", "catalog-media", fileName), photoBytes);
  const product = { ...confirmedTeaFixture[0]!, id: "demo-published-new-tea", name: "測試新增茶", image: { ...confirmedTeaFixture[0]!.image, src: "/api/demo/catalog/media/" + fileName } };
  await writePublicTeaPublication([...confirmedTeaFixture, product]);
  const items = await readPublicTeaCatalog();
  const displayed = items.find(p => p.id === product.id);
  expect(displayed?.name).toBe("測試新增茶");
  expect(displayed?.image.src).toBe("/api/public/media/" + fileName);
  expect(await readFile(join(directory, "media", fileName))).toEqual(photoBytes);
  await writePublicTeaPublication([...confirmedTeaFixture, { ...product, publication: "draft" }]);
  expect((await readPublicTeaCatalog()).some(p => p.id === product.id)).toBe(false);
  const snapshot = JSON.parse(await readFile(process.env.PUBLIC_CATALOG_VISIBILITY_PATH, "utf8"));
  expect(snapshot.products.some((p: { id: string }) => p.id === product.id)).toBe(false);
});
