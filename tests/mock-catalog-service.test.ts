import { expect, test } from "vitest";
import { createMockCatalogService } from "@/lib/domain/mock/mock-catalog-service";

test("paginates 41 or more deterministic synthetic products without duplicates", async () => {
  const service = createMockCatalogService({ pageSize: 12 });
  const seen = new Set<string>();
  let cursor: string | undefined;
  let total = 0;

  do {
    const result = await service.listProducts(cursor === undefined ? { limit: 12 } : { cursor, limit: 12 });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    result.value.items.forEach((product) => seen.add(product.id));
    total += result.value.items.length;
    cursor = result.value.nextCursor ?? undefined;
  } while (cursor);

  expect(total).toBeGreaterThanOrEqual(41);
  expect(seen.size).toBe(total);
});

test("returns explicit empty and catalog-error results", async () => {
  const empty = await createMockCatalogService({ scenario: "empty" }).listProducts();
  const failed = await createMockCatalogService({ scenario: "catalog-error" }).listProducts();
  expect(empty).toMatchObject({ ok: true, value: { items: [], nextCursor: null } });
  expect(failed).toMatchObject({ ok: false, error: { code: "catalog-unavailable" } });
});

test("filters by category and taste without changing stable product identity", async () => {
  const service = createMockCatalogService({ pageSize: 50 });
  const result = await service.listProducts({ category: "oolong", taste: "sweet" });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value.items.length).toBeGreaterThan(0);
  expect(result.value.items.every((product) =>
    product.category === "oolong" && product.tasteTags.includes("sweet"),
  )).toBe(true);
});
