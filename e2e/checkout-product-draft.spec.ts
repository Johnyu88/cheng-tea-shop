import { expect, test, type Page } from "@playwright/test";

async function addTeaAndOpenCheckout(page: Page) {
  await page.goto("/tea/mock-tea-001");
  await page.getByRole("button", { name: "加入購物車" }).click();
  await expect(page.getByRole("status")).toContainText("已加入購物車");
  await page.getByRole("link", { name: "查看購物車" }).click();
  await expect(page.getByRole("link", { name: "前往結帳" })).toHaveAttribute("href", "/checkout");
  await page.getByRole("link", { name: "前往結帳" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
}

async function completeCheckout(page: Page) {
  await page.getByLabel("姓名").fill("陳小姐");
  await page.getByLabel("手機號碼").fill("0912000000");
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByLabel("宅配地址").fill("茶行路 1 號");
  await page.getByRole("button", { name: "下一步" }).click();
}

test("cart checkout link leads through a happy guest checkout", async ({ page }) => {
  await addTeaAndOpenCheckout(page);
  await expect(page.getByRole("heading", { name: "聯絡資料" })).toBeVisible();
  await completeCheckout(page);

  await expect(page.getByRole("heading", { name: "確認訂單" })).toBeVisible();
  await expect(page.getByLabel("訂單摘要")).toContainText("合成茶品 001");
  await page.getByRole("button", { name: "送出訂單" }).click();
  await expect(page.getByText("訂單編號：MOCK-ORDER-001")).toBeVisible();
  await expect(page.getByRole("link", { name: "電話聯絡我們" })).toHaveAttribute("href", "tel:0800000000");
});

test("checkout recovers from step errors without losing entered values", async ({ page }) => {
  await addTeaAndOpenCheckout(page);
  await page.getByLabel("姓名").fill("陳小姐");
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("alert")).toContainText("請填寫手機號碼");

  await page.getByLabel("手機號碼").fill("0912000000");
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("alert")).toContainText("宅配請填寫地址");

  await page.getByLabel("宅配地址").fill("茶行路 1 號");
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "返回配送方式" }).click();
  await expect(page.getByLabel("宅配地址")).toHaveValue("茶行路 1 號");
  await page.getByRole("button", { name: "上一步" }).click();
  await expect(page.getByLabel("姓名")).toHaveValue("陳小姐");
  await expect(page.getByLabel("手機號碼")).toHaveValue("0912000000");
});

test("repeated final action resolves to one visible confirmation", async ({ page }) => {
  await addTeaAndOpenCheckout(page);
  await completeCheckout(page);

  await page.getByRole("button", { name: "送出訂單" }).dblclick();
  await expect(page.getByRole("heading", { name: "訂單已成立" })).toBeVisible();
  await expect(page.getByText("訂單編號：MOCK-ORDER-001")).toHaveCount(1);
});

test("checkout controls stay visible without horizontal overflow on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await addTeaAndOpenCheckout(page);

  const phone = page.getByLabel("手機號碼");
  const next = page.getByRole("button", { name: "下一步" });
  await expect(phone).toBeVisible();
  await expect(next).toBeVisible();
  expect((await phone.boundingBox())?.height).toBeGreaterThanOrEqual(48);
  expect((await next.boundingBox())?.height).toBeGreaterThanOrEqual(48);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
