import { expect, test } from "@playwright/test";

test("customer can add, update, remove, and empty a cart line", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "查看茶品" }).first().click();

  await expect(page).toHaveURL(/\/tea\/mock-tea-001$/);
  await expect(page.getByRole("heading", { level: 1, name: "合成茶品 001" })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "購買數量" })).toBeVisible();
  await expect(page.getByRole("button", { name: "加入購物車" })).toBeEnabled();

  await page.getByRole("button", { name: "增加數量" }).click();
  await expect(page.getByRole("spinbutton", { name: "購買數量" })).toHaveValue("2");
  await page.getByRole("button", { name: "加入購物車" }).click();
  await expect(page.getByRole("status")).toContainText("已加入購物車");
  await page.getByRole("link", { name: "查看購物車" }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("heading", { level: 1, name: "購物車" })).toBeVisible();
  await expect(page.getByRole("region", { name: "購物車摘要" })).toContainText("小計：NT$1,020");
  await expect(page.getByRole("button", { name: "前往結帳" })).toBeDisabled();

  const quantity = page.getByLabel("合成茶品 001數量");
  await quantity.fill("3");
  await expect(page.getByRole("status")).toContainText("購物車數量已更新");
  await expect(page.getByRole("region", { name: "購物車摘要" })).toContainText("小計：NT$1,530");

  await page.getByRole("button", { name: "移除 合成茶品 001" }).click();
  await expect(page.getByRole("status")).toContainText("已移除茶品");
  await expect(page.getByRole("heading", { level: 1, name: "購物車是空的" })).toBeVisible();
  await expect(page.getByRole("link", { name: "開始選茶" })).toBeVisible();
});

test("detail and cart controls have accessible names and responsive layouts", async ({ page }) => {
  await page.goto("/tea/mock-tea-001");

  await expect(page.getByRole("heading", { level: 1, name: "合成茶品 001" })).toBeVisible();
  const quantity = page.getByRole("spinbutton", { name: "購買數量" });
  await expect(quantity).toHaveAttribute("type", "number");
  await expect(page.getByRole("button", { name: "減少數量" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "增加數量" })).toBeEnabled();
  await expect(page.locator("main > article")).toHaveCSS("display", "grid");

  await page.getByRole("button", { name: "增加數量" }).focus();
  await expect(page.getByRole("button", { name: "增加數量" })).toHaveCSS("outline-style", "solid");

  await quantity.fill("6");
  await page.getByRole("button", { name: "加入購物車" }).click();
  await expect(page.getByRole("alert")).toContainText("最多購買 5 件");

  await page.goto("/tea/does-not-exist");
  await expect(page.getByRole("alert")).toContainText("找不到這項茶品");
  await expect(page.getByRole("link", { name: "返回茶品目錄" })).toHaveAttribute("href", "/#catalog");
});

test("detail and cart avoid horizontal overflow on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tea/mock-tea-001");

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await expect(page.locator("main > article")).toHaveCSS("grid-template-columns", "1fr");

  await page.getByRole("button", { name: "增加數量" }).click();
  await page.getByRole("button", { name: "加入購物車" }).click();
  await page.getByRole("link", { name: "查看購物車" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("sold-out detail keeps the product visible and purchase unavailable", async ({ page }) => {
  await page.goto("/tea/mock-tea-048");
  await expect(page.getByRole("heading", { level: 1, name: "合成茶品 048" })).toBeVisible();
  await expect(page.getByText("目前售完")).toBeVisible();
  await expect(page.getByRole("button", { name: "加入購物車" })).toBeDisabled();
});
