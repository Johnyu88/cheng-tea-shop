import { expect, test } from "@playwright/test";

const entries = [
  { path: "/?pwa=storefront", manifest: "/manifest-storefront.webmanifest", title: "陳老師茶行", heading: "慢慢選一杯好茶" },
  { path: "/admin/products?pwa=products", manifest: "/manifest-products.webmanifest", title: "茶行商品管理", heading: "商品管理" },
  { path: "/admin/orders?pwa=orders", manifest: "/manifest-orders.webmanifest", title: "茶行訂單管理", heading: "商家訂單 Demo" },
];

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("each mobile launch entry keeps its route and manifest after reload", async ({ page, request }) => {
  for (const entry of entries) {
    await page.goto(entry.path);
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Application error");
    const route = new URL(page.url()).pathname;
    const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestUrl).toBe(entry.manifest);
    const response = await request.get(entry.manifest);
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest.start_url).toBe(entry.path);
    expect(manifest.scope).toBeDefined();
    expect(manifest.icons).toHaveLength(2);
    await expect(page).toHaveTitle(entry.title);
    await expect(page.getByRole("heading", { name: entry.heading }).first()).toBeVisible();
    await page.reload();
    expect(new URL(page.url()).pathname).toBe(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
