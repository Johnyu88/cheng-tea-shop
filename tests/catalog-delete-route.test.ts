import { afterEach, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { writePublicTeaPublication } = vi.hoisted(() => ({ writePublicTeaPublication: vi.fn() }));
vi.mock("@/lib/server/public-tea-publication", () => ({ writePublicTeaPublication }));

import { DELETE } from "@/app/api/demo/catalog/route";
import { issueDemoMerchantCookie } from "@/lib/server/demo-access";
import { getDemoCatalogStore } from "@/lib/server/demo-catalog-store";

let directory = "";
const draft = { name: "可刪除測試茶", specification: "一兩", price: { currency: "TWD" as const, amount: 888 }, category: "black" as const, inventoryStatus: "available" as const, tasteTags: [] };

afterEach(async () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = "";
});

async function setup() {
  directory = await mkdtemp(join(tmpdir(), "catalog-delete-route-"));
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled");
  vi.stubEnv("DEMO_DATA_DIR", directory);
  vi.stubEnv("PUBLIC_CATALOG_VISIBILITY_PATH", join(directory, "public.json"));
  vi.stubEnv("DEMO_MERCHANT_SECRET", "44".repeat(32));
  const cookie = issueDemoMerchantCookie("44".repeat(32))!.split(";")[0]!;
  return { host: "127.0.0.1:3016", origin: "http://127.0.0.1:3016", "content-type": "application/json", cookie };
}

const deleteRequest = (headers: Record<string, string>, id: string) => new Request("http://127.0.0.1:3016/api/demo/catalog", { method: "DELETE", headers, body: JSON.stringify({ id }) });

it("deletes an unpublished product and resynchronizes the public catalog", async () => {
  const headers = await setup();
  const created = await getDemoCatalogStore().publish(draft, "draft");
  writePublicTeaPublication.mockResolvedValueOnce(undefined);

  const response = await DELETE(deleteRequest(headers, created.id));

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ ok: true, value: { id: created.id, name: "可刪除測試茶" } });
  expect(response.headers.get("x-demo-write-status")).toBe("persisted");
  expect(writePublicTeaPublication).toHaveBeenCalledTimes(1);
  expect((await getDemoCatalogStore().list()).some((item) => item.id === created.id)).toBe(false);
});

it("refuses to delete a published product", async () => {
  const headers = await setup();
  const created = await getDemoCatalogStore().publish(draft, "published");

  const response = await DELETE(deleteRequest(headers, created.id));

  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ ok: false, error: "上架中的商品不能刪除，請先下架" });
  expect(response.headers.get("x-demo-write-status")).toBe("not-started");
  expect(writePublicTeaPublication).not.toHaveBeenCalled();
  expect((await getDemoCatalogStore().list()).some((item) => item.id === created.id)).toBe(true);
});

it("requires a merchant session", async () => {
  const headers: Record<string, string> = await setup();
  delete headers.cookie;
  const created = await getDemoCatalogStore().publish(draft, "draft");

  const response = await DELETE(deleteRequest(headers, created.id));

  expect(response.status).toBe(400);
  expect((await getDemoCatalogStore().list()).some((item) => item.id === created.id)).toBe(true);
});
