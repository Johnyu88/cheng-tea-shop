import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { createDemoCatalogStore } from "@/lib/server/demo-catalog-store";
import type { ProductDraft } from "@/lib/domain";

const execFileAsync = promisify(execFile);
const directories: string[] = [];
const draft = (name: string): ProductDraft => ({
  name,
  specification: "一兩",
  price: { currency: "TWD", amount: 888 },
  category: "black",
  inventoryStatus: "available",
  tasteTags: [],
});

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

it("retains products written by two separate Node processes after both processes stop", async () => {
  const directory = await mkdtemp(join(tmpdir(), "product-11-processes-"));
  directories.push(directory);
  const child = join(process.cwd(), "tests", "product-11-multiprocess-child.test.ts");
  const run = (name: string) => execFileAsync(process.execPath, [join(process.cwd(), "node_modules", "vitest", "vitest.mjs"), "run", child, "--reporter=dot"], {
    cwd: process.cwd(),
    windowsHide: true,
    env: { ...process.env, PRODUCT_11_CHILD: "1", PRODUCT_11_SHARED_DIR: directory, PRODUCT_11_PRODUCT_NAME: name },
  });
  await Promise.all([run("合成多程序第11筆"), run("合成多程序第12筆")]);

  const reloaded = await createDemoCatalogStore({ filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "media"), seedProducts: [] }).list();
  expect(reloaded.map((product) => product.name)).toEqual(expect.arrayContaining(["合成多程序第11筆", "合成多程序第12筆"]));
  expect(JSON.parse(await readFile(join(directory, "catalog.json"), "utf8")).products).toHaveLength(2);
}, 30000);

it("times out on an abandoned lock, then recovers after the lock is removed", async () => {
  const directory = await mkdtemp(join(tmpdir(), "product-11-lock-"));
  directories.push(directory);
  const filePath = join(directory, "catalog.json");
  await writeFile(`${filePath}.lock`, "abandoned by synthetic process", "utf8");
  const store = createDemoCatalogStore({ filePath, mediaDirectory: join(directory, "media"), seedProducts: [] });

  await expect(store.publish(draft("鎖逾時商品"), "draft")).rejects.toThrow("尚未確認儲存");
  await rm(`${filePath}.lock`);
  await expect(store.publish(draft("鎖恢復商品"), "draft")).resolves.toMatchObject({ name: "鎖恢復商品" });
}, 10000);
