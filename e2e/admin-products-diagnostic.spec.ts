import { expect, test } from "@playwright/test";

test.describe("admin products diagnostic mode", () => {
  test("renders its static panel and starts independently of product React", async ({ page }) => {
    await page.goto("/admin/products?diagnostics=1");
    await expect(page.locator("#tea-admin-diagnostics")).toContainText("HTML 已載入");
    await expect(page.locator("#tea-admin-diagnostics-events")).toContainText("JS-READY");
  });

  test("keeps the diagnostic marker visible when Next product chunks are blocked", async ({ page }) => {
    await page.route("**/_next/static/**/*.js", route => route.abort());
    await page.goto("/admin/products?diagnostics=1");
    await expect(page.locator("#tea-admin-diagnostics")).toContainText("JS-STARTED");
    await expect(page.locator("#tea-admin-diagnostics-events")).not.toContainText("REACT-MOUNTED");
  });

  test("records Session status without exposing a response body", async ({ page }) => {
    await page.route("**/api/demo/admin/session", async route => {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false, error: "denied" }) });
    });
    await page.goto("/admin/products?diagnostics=1");
    await expect(page.locator("#tea-admin-diagnostics-events")).toContainText("SESSION-401");
    await expect(page.locator("#tea-admin-diagnostics-events")).not.toContainText("denied");
  });

  test("records Catalog status without exposing product data", async ({ page }) => {
    await page.route("**/api/demo/admin/session", async route => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, value: { provider: "password", state: "ready", simulated: false, authenticated: true, passkey: { enabled: false, registered: false } } }) });
    });
    await page.route("**/api/demo/catalog?limit=50&includeUnpublished=true", async route => {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, error: "catalog unavailable", value: { items: [{ name: "secret-product" }] } }) });
    });
    await page.goto("/admin/products?diagnostics=1");
    await expect(page.locator("#tea-admin-diagnostics-events")).toContainText("CATALOG-503");
    await expect(page.locator("#tea-admin-diagnostics-events")).not.toContainText("secret-product");
  });

  test("keeps a malformed product visible without hiding the full list", async ({ page }) => {
    await page.route("**/api/demo/admin/session", async route => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, value: { provider: "password", state: "ready", simulated: false, authenticated: true, passkey: { enabled: false, registered: false } } }) });
    });
    await page.route("**/api/demo/catalog?limit=50&includeUnpublished=true", async route => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, value: { items: [{ ...{ id: "broken", name: "測試資料", category: "oolong", publication: "published", image: { src: null, alt: "測試", isPlaceholder: true }, tasteTags: [], summary: "" }, variants: undefined }] } }) });
    });
    await page.goto("/admin/products?diagnostics=1");
    await expect(page.getByRole("heading", { name: "商品管理" })).toBeVisible();
    await expect(page.getByText("測試資料")).toBeVisible();
    await expect(page.getByText("規格：未設定／NT$—")).toBeVisible();
    await expect(page.getByText("ADMIN_PRODUCTS_RENDER_ERROR")).toHaveCount(0);
  });

  test("does not request the diagnostic script in normal mode", async ({ page }) => {
    const diagnosticRequests: string[] = [];
    page.on("request", request => { if (request.url().includes("/diagnostics/admin-products.js")) diagnosticRequests.push(request.url()); });
    await page.goto("/admin/products");
    expect(diagnosticRequests).toEqual([]);
    await expect(page.locator("#tea-admin-diagnostics")).toHaveCount(0);
  });
});
