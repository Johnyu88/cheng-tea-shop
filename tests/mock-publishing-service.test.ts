import { expect, test } from "vitest";
import { createMockPublishingService } from "@/lib/domain/mock/mock-publishing-service";
import type { ProductDraft } from "@/lib/domain/types";

const draft: ProductDraft = {
  name: "山霧茶",
  specification: "一兩",
  price: { currency: "TWD", amount: 800 },
  category: "oolong",
  inventoryStatus: "available",
  tasteTags: ["sweet"],
  summary: "清甜柔順",
};

test.each([
  ["name", { name: "   " }],
  ["specification", { specification: "\t" }],
])("rejects a blank %s", async (_field, change) => {
  const result = await createMockPublishingService().saveDraft({ ...draft, ...change });

  expect(result).toMatchObject({ ok: false, error: { code: "invalid-draft" } });
});

test.each([
  ["fractional", 800.5],
  ["negative", -1],
])("rejects a %s TWD amount", async (_case, amount) => {
  const result = await createMockPublishingService().saveDraft({
    ...draft,
    price: { currency: "TWD", amount },
  });

  expect(result).toMatchObject({ ok: false, error: { code: "invalid-draft" } });
});

test("rejects an unsupported category or inventory status", async () => {
  const service = createMockPublishingService();

  await expect(service.saveDraft({ ...draft, category: "herbal" as ProductDraft["category"] })).resolves.toMatchObject({
    ok: false,
    error: { code: "invalid-draft" },
  });
  await expect(service.saveDraft({ ...draft, inventoryStatus: "backorder" as ProductDraft["inventoryStatus"] })).resolves.toMatchObject({
    ok: false,
    error: { code: "invalid-draft" },
  });
});

test("rejects more than three photo metadata entries", async () => {
  const result = await createMockPublishingService().saveDraft({
    ...draft,
    photos: [
      { id: "1", previewUrl: "blob:1", alt: "一" },
      { id: "2", previewUrl: "blob:2", alt: "二" },
      { id: "3", previewUrl: "blob:3", alt: "三" },
      { id: "4", previewUrl: "blob:4", alt: "四" },
    ],
  });

  expect(result).toMatchObject({ ok: false, error: { code: "invalid-draft" } });
});

test("generates a deterministic summary from supplied facts and selected tags", async () => {
  const service = createMockPublishingService();
  const result = await service.generateSummary({ ...draft, origin: "阿里山", roast: "輕焙" });

  expect(result).toMatchObject({ ok: true });
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value).toContain("山霧茶");
  expect(result.value).toContain("一兩");
  expect(result.value).toContain("800");
  expect(result.value).toContain("sweet");
  expect(result.value).toContain("阿里山");
  expect(result.value).toContain("輕焙");
  expect(result.value).not.toContain("療效");
  const repeated = await service.generateSummary({ ...draft, origin: "阿里山", roast: "輕焙" });
  expect(repeated).toMatchObject({ ok: true, value: result.value });
});

test("calls out missing optional facts without inventing them", async () => {
  const result = await createMockPublishingService().generateSummary(draft);

  expect(result).toMatchObject({ ok: true });
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value).toContain("未提供");
  expect(result.value).not.toContain("產地");
  expect(result.value).not.toContain("認證");
  expect(result.value).not.toContain("收成");
});

test("returns a deeply cloned draft and does not publish it when saving", async () => {
  const service = createMockPublishingService();
  const input: ProductDraft = {
    ...draft,
    tasteTags: ["sweet"],
    photos: [{ id: "photo-1", previewUrl: "blob:1", alt: "茶葉" }],
  };

  const result = await service.saveDraft(input);

  expect(result).toMatchObject({ ok: true, value: input });
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value).not.toBe(input);
  expect(result.value.tasteTags).not.toBe(input.tasteTags);
  expect(result.value.photos).not.toBe(input.photos);
  expect(result.value.photos?.[0]).not.toBe(input.photos?.[0]);
  input.tasteTags.push("rich");
  const inputPhoto = input.photos?.[0];
  if (!inputPhoto) throw new Error("expected photo metadata");
  inputPhoto.alt = "changed";
  expect(result.value.tasteTags).toEqual(["sweet"]);
  expect(result.value.photos?.[0]?.alt).toBe("茶葉");

  const published = await service.publishDraft(input, { confirmed: true });
  expect(published).toMatchObject({ ok: true, value: { publication: "published" } });
});

test("rejects publication without explicit confirmation and preserves the sequence", async () => {
  const service = createMockPublishingService();

  await expect(service.publishDraft(draft, { confirmed: false })).resolves.toMatchObject({
    ok: false,
    error: { code: "invalid-draft" },
  });
  await expect(service.publishDraft(draft, { confirmed: true })).resolves.toMatchObject({
    ok: true,
    value: { id: "mock-published-1" },
  });
});

test("publishes exactly one cloned variant", async () => {
  const result = await createMockPublishingService().publishDraft(draft, { confirmed: true });

  expect(result).toMatchObject({
    ok: true,
    value: {
      name: "山霧茶",
      publication: "published",
      variants: [{ specification: "一兩", price: { currency: "TWD", amount: 800 } }],
    },
  });
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value.variants).toHaveLength(1);
  expect(result.value.tasteTags).not.toBe(draft.tasteTags);
  expect(result.value.variants[0]?.price).not.toBe(draft.price);
});
