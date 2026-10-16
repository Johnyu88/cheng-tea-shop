import { afterEach, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/demo/catalog/route";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDemoCatalogStore } from "@/lib/server/demo-catalog-store";
import { issueDemoMerchantCookie } from "@/lib/server/demo-access";

let directory = "";
afterEach(async () => { vi.unstubAllEnvs(); if (directory) await rm(directory, { recursive: true, force: true }); directory = ""; });

it("persists a new unpublished draft across store instances without exposing it as published", async () => {
  directory = await mkdtemp(join(tmpdir(), "tea-draft-"));
  const filePath = join(directory, "catalog.json");
  const options = { filePath, mediaDirectory: join(directory, "media"), seedProducts: [] };
  const store = createDemoCatalogStore(options);
  const draft = { name: "測試紅茶A", specification: "一兩", price: { currency: "TWD" as const, amount: 888 }, category: "black" as const, inventoryStatus: "available" as const, tasteTags: [] };
  const created = await store.publish(draft, "draft");
  expect(created.publication).toBe("draft");
  const reloaded = await createDemoCatalogStore(options).list();
  expect(reloaded).toHaveLength(1);
  expect(reloaded[0]).toMatchObject({ id: created.id, name: "測試紅茶A", publication: "draft" });
  expect(reloaded.filter((item) => item.publication === "published")).toHaveLength(0);
  expect((JSON.parse(await readFile(filePath, "utf8")) as { products: unknown[] }).products).toHaveLength(1);
});
it("POST draft survives GET and remains hidden from public catalog", async () => {
  directory = await mkdtemp(join(tmpdir(), "tea-route-draft-"));
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled");
  vi.stubEnv("DEMO_DATA_DIR", directory);
  vi.stubEnv("PUBLIC_CATALOG_VISIBILITY_PATH", join(directory, "public.json"));
  vi.stubEnv("DEMO_MERCHANT_SECRET", "22".repeat(32));
  const cookie = issueDemoMerchantCookie("22".repeat(32))!.split(";")[0]!;
  const base = "http://127.0.0.1:3014/api/demo/catalog";
  const headers = { host: "127.0.0.1:3014", origin: "http://127.0.0.1:3014", "content-type": "application/json", cookie };
  const draft = { name: "測試紅茶A", specification: "一兩", price: { currency: "TWD", amount: 888 }, category: "black", inventoryStatus: "available", tasteTags: [] };
  const response = await POST(new Request(base + "?publication=draft", { method: "POST", headers, body: JSON.stringify(draft) }));
  expect(response.status).toBe(201);
  expect(response.headers.get("x-demo-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  expect(response.headers.get("x-demo-instance-id")).toBeTruthy();
  expect(response.headers.get("x-demo-write-status")).toBe("persisted");
  expect(response.headers.get("x-demo-sync-status")).toBe("completed");
  const created = await response.json();
  expect(created.value.publication).toBe("draft");
  const admin = await (await GET(new Request(base + "?includeUnpublished=true", { headers }))).json();
  const publicCatalog = await (await GET(new Request(base, { headers: { host: headers.host } }))).json();
  expect(admin.value.items.some((p: { id: string }) => p.id === created.value.id)).toBe(true);
  expect(publicCatalog.value.items.some((p: { id: string }) => p.id === created.value.id)).toBe(false);
});

it("propagates a safe inbound request ID and reports status and duration without product data", async () => {
  directory = await mkdtemp(join(tmpdir(), "tea-route-diagnostic-"));
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled");
  vi.stubEnv("DEMO_DATA_DIR", directory);
  vi.stubEnv("PUBLIC_CATALOG_VISIBILITY_PATH", join(directory, "public.json"));
  vi.stubEnv("DEMO_MERCHANT_SECRET", "44".repeat(32));
  const cookie = issueDemoMerchantCookie("44".repeat(32))!.split(";")[0]!;
  const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
  const correlationId = "obs12-synthetic-001";
  const headers = { host: "127.0.0.1:3016", origin: "http://127.0.0.1:3016", "content-type": "application/json", cookie, "x-demo-request-id": correlationId };
  const response = await POST(new Request("http://127.0.0.1:3016/api/demo/catalog?publication=draft", {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "診斷合成商品", specification: "一兩", price: { currency: "TWD", amount: 888 }, category: "black", inventoryStatus: "available", tasteTags: [] }),
  }));

  expect(response.status).toBe(201);
  expect(response.headers.get("x-demo-request-id")).toBe(correlationId);
  const entries = info.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, string>);
  expect(entries).toEqual(expect.arrayContaining([
    expect.objectContaining({ scope: "demo-catalog", event: "received", requestId: correlationId, method: "POST" }),
    expect.objectContaining({ scope: "demo-catalog", event: "completed", requestId: correlationId, method: "POST", httpStatus: "201", writeStatus: "persisted", syncStatus: "completed", durationMs: expect.stringMatching(/^\d+$/) }),
  ]));
  expect(info.mock.calls.flat().join(" ")).not.toContain("診斷合成商品");
});

it("keeps a successful product write when the diagnostic sink throws", async () => {
  directory = await mkdtemp(join(tmpdir(), "tea-route-diagnostic-sink-"));
  vi.stubEnv("DEMO_COMMERCE_LOCAL", "enabled");
  vi.stubEnv("DEMO_DATA_DIR", directory);
  vi.stubEnv("PUBLIC_CATALOG_VISIBILITY_PATH", join(directory, "public.json"));
  vi.stubEnv("DEMO_MERCHANT_SECRET", "55".repeat(32));
  const cookie = issueDemoMerchantCookie("55".repeat(32))!.split(";")[0]!;
  vi.spyOn(console, "info").mockImplementation(() => { throw new Error("synthetic diagnostic sink failure"); });
  const headers = { host: "127.0.0.1:3017", origin: "http://127.0.0.1:3017", "content-type": "application/json", cookie };
  const response = await POST(new Request("http://127.0.0.1:3017/api/demo/catalog?publication=draft", {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "診斷失效仍可寫入", specification: "一兩", price: { currency: "TWD", amount: 888 }, category: "black", inventoryStatus: "available", tasteTags: [] }),
  }));

  expect(response.status).toBe(201);
  expect((await response.json()).ok).toBe(true);
});
