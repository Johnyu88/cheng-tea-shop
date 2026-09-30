import { expect, test, type Page } from "@playwright/test";

async function addTeaAndOpenCheckout(page: Page) {
  await page.goto("/tea/mock-tea-001");
  await page.getByRole("button", { name: "加入購物車" }).click();
  await expect(page).toHaveURL(/\/cart$/);
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

async function completeMinimumProductDraft(page: Page) {
  await expect(page.getByRole("heading", { name: "新增商品" })).toBeVisible();
  await expect(page.locator("main[data-hydrated='true']")).toBeVisible();
  await page.getByLabel("茶名").fill("春茶");
  await page.getByLabel("規格", { exact: true }).fill("150g");
  await page.getByLabel("價格（TWD）").fill("1200");
  await page.getByLabel("茶類").selectOption("oolong");
  await page.getByLabel("庫存").selectOption("available");
}

test("cart checkout link leads through a happy guest checkout", async ({ page }) => {
  await addTeaAndOpenCheckout(page);
  await expect(page.getByRole("heading", { name: "聯絡資料" })).toBeVisible();
  await expect(page.getByText("此頁為合成展示／原型，不會送出真實付款，也不會保存付款資料。")).toBeVisible();
  await completeCheckout(page);

  await expect(page.getByRole("heading", { name: "確認訂單" })).toBeVisible();
  await expect(page.getByText("此頁為合成展示／原型，不會送出真實付款，也不會保存付款資料。")).toBeVisible();
  await expect(page.getByLabel("訂單摘要")).toContainText("合成茶品 001");
  await page.getByRole("button", { name: "送出訂單" }).click();
  await expect(page.getByText("訂單編號：MOCK-ORDER-001")).toBeVisible();
  await expect(page.getByText("此頁為合成展示／原型，不會送出真實付款，也不會保存付款資料。")).toBeVisible();
  await expect(page.getByRole("link", { name: "電話聯絡我們" })).toHaveAttribute("href", "tel:0800000000");
});

test("checkout recovers from step errors without losing entered values", async ({ page }) => {
  await addTeaAndOpenCheckout(page);
  await page.getByLabel("姓名").fill("陳小姐");
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "請填寫手機號碼" })).toContainText("請填寫手機號碼");

  await page.getByLabel("手機號碼").fill("12345");
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "請填寫正確的台灣手機號碼" })).toContainText("請填寫正確的台灣手機號碼");
  await page.getByLabel("手機號碼").fill("0912000000");
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "宅配請填寫地址" })).toContainText("宅配請填寫地址");

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

test("operator can edit supplied facts and explicitly confirm publication on desktop", async ({ page }) => {
  await page.goto("/admin/products/new");
  await expect(page.getByText("這是本機 Demo：沒有真實管理員驗證，不會連接正式 ERP 或外部影像服務。")).toBeVisible();
  await completeMinimumProductDraft(page);
  await expect(page.getByRole("button", { name: "產生介紹草稿" })).toHaveCount(0);
  const summary = page.getByLabel("商品介紹", { exact: true });
  await summary.fill("由店家提供的春茶介紹");

  const publish = page.getByRole("button", { name: "確認並上架" });
  const confirmation = page.getByLabel("我已確認照片與商品資料");
  await expect(publish).toBeDisabled();
  await confirmation.check();
  await expect(publish).toBeEnabled();

  await summary.fill("由店家確認的介紹");
  await page.getByLabel("價格（TWD）").fill("1250");
  await expect(confirmation).not.toBeChecked();
  await expect(publish).toBeDisabled();
  await expect(summary).toHaveValue("由店家確認的介紹");
  await confirmation.check();
  await publish.click();
  await expect(page.getByRole("heading", { name: "商品已上架" })).toBeVisible();
  await expect(page.getByText("已上架商品：春茶", { exact: true })).toBeVisible();
  await expect(page.getByText("規格：150g／NT1250", { exact: true })).toBeVisible();
});

test("operator can save an unpublished product on desktop", async ({ page }) => {
  await page.goto("/admin/products/new");
  await completeMinimumProductDraft(page);
  await page.getByRole("button", { name: "儲存商品" }).click();
  await expect(page.getByRole("heading", { name: "儲存成功" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("商品草稿已儲存，尚未上架。");
  await expect(page.getByRole("link", { name: "返回商品管理", exact: true })).toHaveAttribute("href", "/admin/products");
  await expect(page.getByRole("link", { name: "繼續新增商品" })).toHaveAttribute("href", "/admin/products/new");
});

test("operator can complete the minimum fields and save a product on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/admin/products/new");
  await completeMinimumProductDraft(page);

  const save = page.getByRole("button", { name: "儲存商品" });
  await expect(save).toBeVisible();
  expect((await save.boundingBox())?.height).toBeGreaterThanOrEqual(48);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await save.click();
  await expect(page.getByRole("heading", { name: "儲存成功" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("商品草稿已儲存，尚未上架。");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
