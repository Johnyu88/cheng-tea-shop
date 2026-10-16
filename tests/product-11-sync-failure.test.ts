import { afterEach, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { writePublicTeaPublication } = vi.hoisted(() => ({ writePublicTeaPublication: vi.fn() }));
vi.mock("@/lib/server/public-tea-publication", () => ({ writePublicTeaPublication }));

import { POST } from "@/app/api/demo/catalog/route";
import { issueDemoMerchantCookie } from "@/lib/server/demo-access";
import { getDemoCatalogStore } from "@/lib/server/demo-catalog-store";

let directory = "";

afterEach(async () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = "";
});

it("reports persisted-but-unsynced instead of inviting a duplicate POST", async () => {
  directory = await mkdtemp(join(tmpdir(), "product-11-sync-failure-"));
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled");
  vi.stubEnv("DEMO_DATA_DIR", directory);
  vi.stubEnv("PUBLIC_CATALOG_VISIBILITY_PATH", join(directory, "public.json"));
  vi.stubEnv("DEMO_MERCHANT_SECRET", "33".repeat(32));
  writePublicTeaPublication.mockRejectedValueOnce(new Error("synthetic sync failure"));
  const cookie = issueDemoMerchantCookie("33".repeat(32))!.split(";")[0]!;
  const headers = { host: "127.0.0.1:3015", origin: "http://127.0.0.1:3015", "content-type": "application/json", cookie };
  const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

  const response = await POST(new Request("http://127.0.0.1:3015/api/demo/catalog?publication=draft", {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "合成同步失敗", specification: "一兩", price: { currency: "TWD", amount: 888 }, category: "black", inventoryStatus: "available", tasteTags: [] }),
  }));

  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ ok: false, error: "商品已寫入，但公開同步尚未完成；請勿重複新增。" });
  expect(response.headers.get("x-demo-write-status")).toBe("persisted");
  expect(response.headers.get("x-demo-sync-status")).toBe("failed");

  const afterPost = await getDemoCatalogStore().list();
  const matching = afterPost.filter((item) => item.name === "合成同步失敗");
  expect(matching).toHaveLength(1);
  writePublicTeaPublication.mockResolvedValueOnce(undefined);
  await writePublicTeaPublication(afterPost);
  expect((await getDemoCatalogStore().list()).filter((item) => item.name === "合成同步失敗")).toHaveLength(1);
  expect(writePublicTeaPublication).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ name: "合成同步失敗" })]));
  const diagnostics = info.mock.calls.flat().join(" ");
  expect(diagnostics).not.toContain("合成同步失敗");
  expect(diagnostics).not.toContain("33".repeat(32));
});
