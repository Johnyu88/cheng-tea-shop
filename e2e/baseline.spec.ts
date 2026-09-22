import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage exposes the storefront starting point", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "慢慢選一杯好茶" })).toBeVisible();
  await expect(page.getByRole("link", { name: "開始選茶" })).toHaveAttribute("href", "#baseline");
});

test("health endpoint reports readiness", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

test("homepage has no detectable axe violations", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("primary storefront routes have no detectable axe violations", async ({ page }) => {
  for (const path of ["/tea/mock-tea-001", "/cart", "/checkout", "/admin/products/new"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${path} accessibility violations`).toEqual([]);
  }
});
