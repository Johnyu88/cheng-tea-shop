import { describe, expect, it } from "vitest";
import {
  CSV_HEADERS,
  buildDryRunReport,
  parseCsv,
  parseJson,
  validateRecords,
} from "../scripts/phase-9a-product-import";

const validRecord = {
  content_id: "tea-example-v1",
  product_name: "Synthetic example",
  tea_type: "oolong",
  origin: null,
  harvest_year: null,
  weight_g: 150,
  price_twd: 1200,
  aroma: null,
  taste: null,
  aftertaste: null,
  brewing: {
    water_temperature_c: null,
    tea_weight_g: null,
    water_ml: null,
    steep_seconds: null,
    instructions: null,
  },
  inventory_status: "available",
  product_image: {
    file_name: "tea-example-v1__front__v01.jpg",
    alt_text: "Synthetic example placeholder test image",
    source: "synthetic-test",
    license_or_permission: "synthetic-test",
    sha256: "a".repeat(64),
  },
  sort_order: 1,
  publication_status: "draft",
  evidence: {
    facts_source: null,
    photo_permission_source: null,
    reviewer: null,
    reviewed_at: null,
  },
};

describe("Phase 9-A product import toolchain", () => {
  it("parses the canonical CSV header and empty values", () => {
    const csv = `${CSV_HEADERS.join(",")}\n${CSV_HEADERS.map((header) => header === "content_id" ? "tea-example-v1" : "").join(",")}`;
    const parsed = parseCsv(csv);

    expect(parsed.errors).toEqual([]);
    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0]?.content_id).toBe("tea-example-v1");
    expect(parsed.records[0]?.origin).toBeNull();
  });

  it("parses canonical JSON arrays and rejects non-arrays", () => {
    expect(parseJson(JSON.stringify([validRecord])).errors).toEqual([]);
    expect(parseJson(JSON.stringify(validRecord)).errors[0]?.code).toBe("json-root-not-array");
  });

  it("reports missing, duplicate, and numeric format errors without writing data", () => {
    const result = validateRecords([
      { ...validRecord, content_id: "tea-duplicate-v1", price_twd: "NT$1,200", weight_g: "150g" },
      { ...validRecord, content_id: "tea-duplicate-v1", sort_order: 1 },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["invalid-price", "invalid-weight", "duplicate-content-id", "duplicate-sort-order"]),
    );
    expect(result.wouldWrite).toBe(false);
  });

  it("validates image filename correspondence to content ID", () => {
    const result = validateRecords([{ ...validRecord, product_image: { ...validRecord.product_image, file_name: "other-product__front__v01.jpg" } }]);

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ code: "image-content-id-mismatch" }));
  });

  it("builds a clear dry-run report with no apply capability", () => {
    const validation = validateRecords([validRecord]);
    const report = buildDryRunReport("template.json", validation);

    expect(report.mode).toBe("dry-run");
    expect(report.wouldWrite).toBe(false);
    expect(report.acceptedContentIds).toEqual(["tea-example-v1"]);
    expect(report.errors).toEqual([]);

    const invalidReport = buildDryRunReport("invalid.json", validateRecords([{ ...validRecord, price_twd: "not-a-price" }]));
    expect(invalidReport.wouldWrite).toBe(false);
    expect(invalidReport.errors).toContainEqual(expect.objectContaining({ code: "invalid-price" }));
  });
});
