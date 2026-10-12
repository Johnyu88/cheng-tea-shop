import { afterEach, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { confirmedTeaFixture } from "@/lib/domain/mock/confirmed-tea-fixture";
import { readPublicTeaCatalog, writePublicTeaPublication } from "@/lib/server/public-tea-publication";

const original = process.env.PUBLIC_CATALOG_VISIBILITY_PATH;
let directory: string | undefined;
afterEach(async () => {
  if (original === undefined) delete process.env.PUBLIC_CATALOG_VISIBILITY_PATH;
  else process.env.PUBLIC_CATALOG_VISIBILITY_PATH = original;
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
  expect(JSON.stringify(payload)).not.toContain("price");
  await writePublicTeaPublication(confirmedTeaFixture);
  expect((await readPublicTeaCatalog()).length).toBe(8);
});
