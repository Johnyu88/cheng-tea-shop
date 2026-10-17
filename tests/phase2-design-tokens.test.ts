import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

describe("phase 2 storefront design tokens", () => {
  it("defines the approved type, spacing, and semantic color tokens", () => {
    expect(stylesheet).toMatch(/--font-size-display:/);
    expect(stylesheet).toMatch(/--font-size-body:/);
    expect(stylesheet).toMatch(/--line-height-body:/);
    expect(stylesheet).toMatch(/--space-section:/);
    expect(stylesheet).toMatch(/--color-action-primary: #20352e/);
    expect(stylesheet).toMatch(/--color-action-secondary: #dbe6dc/);
    expect(stylesheet).toMatch(/--color-action-quiet: #faf8f2/);
    expect(stylesheet).toMatch(/--color-action-danger: #8b6446/);
  });

  it("defines semantic button layers and product card reading layers", () => {
    for (const className of [
      ".button-primary",
      ".button-secondary",
      ".button-quiet",
      ".button-danger",
      ".product-card-title",
      ".product-card-summary",
      ".product-card-price",
    ]) {
      expect(stylesheet).toContain(className);
    }
  });
});
