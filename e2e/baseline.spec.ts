import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage exposes the storefront starting point", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "慢慢選一杯好茶" })).toBeVisible();
  await expect(page.getByRole("link", { name: "開始選茶" })).toHaveAttribute("href", "#baseline");
});

test("mobile brand navigation stays in the viewport without the retired order lookup", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "訂單查詢" })).toHaveCount(0);
  const browseTeas = page.getByRole("navigation", { name: "主要導覽" }).getByRole("link", { name: "茶品導覽" });
  await expect(browseTeas).toBeVisible();

  const box = await browseTeas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  expect(box!.y + box!.height).toBeLessThanOrEqual(800);
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
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${path} accessibility violations`).toEqual([]);
  }
});
