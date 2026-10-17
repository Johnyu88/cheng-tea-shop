import { expect, test } from "@playwright/test";

const entries = [
  { path: "/?pwa=storefront", manifest: "/manifest-storefront.webmanifest", id: "/tea-pwa/storefront",
    name: "陳老師茶行", shortName: "陳老師茶行", title: "陳老師茶行", scope: "/", icon: "/icons/tea-store-" },
  { path: "/admin/products?pwa=products", manifest: "/manifest-products.webmanifest", id: "/tea-pwa/admin-products",
    name: "陳老師茶行商品管理", shortName: "茶行商品", title: "茶行商品管理", scope: "/admin/products", icon: "/icons/tea-products-" },
  { path: "/admin/orders?pwa=orders", manifest: "/manifest-orders.webmanifest", id: "/tea-pwa/admin-orders",
    name: "陳老師茶行訂單管理", shortName: "茶行訂單", title: "茶行訂單管理", scope: "/admin/orders", icon: "/icons/tea-orders-" },
];

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("each mobile launch entry keeps its identity, icons, and launch route after reload", async ({ page, request }) => {
  for (const entry of entries) {
    await page.goto(entry.path);
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Application error");
    const url = new URL(page.url());
    const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestUrl).toBe(entry.manifest);
    const response = await request.get(entry.manifest);
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest.id).toBe(entry.id);
    expect(manifest.name).toBe(entry.name);
    expect(manifest.short_name).toBe(entry.shortName);
    expect(manifest.start_url).toBe(entry.path);
    expect(manifest.scope).toBe(entry.scope);
    expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
      `${entry.icon}192.png`, `${entry.icon}512.png`,
    ]);
    for (const icon of manifest.icons as Array<{ src: string }>) {
      const image = await request.get(icon.src);
      expect(image.ok()).toBe(true);
      expect(image.headers()["content-type"]).toContain("image/png");
      expect((await image.body()).byteLength).toBeGreaterThan(100);
    }
    await expect(page).toHaveTitle(entry.title);
    const heading = entry.path.startsWith("/admin/products") ? "商品管理登入"
      : entry.path.startsWith("/admin/orders") ? "商家訂單" : "慢慢選一杯好茶";
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
    expect(url.pathname + url.search).toBe(entry.path);
    await page.reload();
    const reloaded = new URL(page.url());
    expect(reloaded.pathname + reloaded.search).toBe(entry.path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("merchant APIs expose no protected order or catalog data without a session", async ({ request }) => {
  for (const path of ["/api/demo/admin/orders", "/api/demo/catalog?limit=50&includeUnpublished=true"]) {
    const response = await request.get(path);
    expect(response.ok(), `unauthenticated request must be blocked: ${path}`).toBe(false);
  }
});
