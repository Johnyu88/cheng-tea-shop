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

async function completeMinimumProductDraft(page: Page) {
  await expect(page.getByRole("heading", { name: "新增一項茶品" })).toBeVisible();
  await expect(page.locator("main[data-hydrated='true']")).toBeVisible();
  await page.getByLabel("茶名").fill("春茶");
  await page.getByLabel("單一規格").fill("150g");
  await page.getByLabel("價格（TWD）").fill("1200");
  await page.getByLabel("茶類").selectOption("oolong");
  await page.getByLabel("有貨").check();
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

test("operator can save, edit a grounded draft, preview, confirm, and publish on desktop", async ({ page }) => {
  await page.goto("/admin/products/new");
  await expect(page.getByText("這是原型頁面：尚未實作真實管理員驗證。")).toBeVisible();
  await completeMinimumProductDraft(page);

  await page.getByRole("button", { name: "儲存草稿" }).click();
  await expect(page.getByRole("status")).toContainText("草稿已儲存");

  await page.getByRole("button", { name: "產生介紹草稿" }).click();
  const summary = page.getByLabel("商品介紹草稿（可編輯）");
  await expect(summary).toHaveValue(/茶名：春茶/);
  await summary.fill("由店家確認的介紹");
  await page.getByRole("button", { name: "預覽電腦版" }).click();
  await expect(page.getByLabel("商品預覽")).toHaveAttribute("data-preview-mode", "desktop");
  await page.getByRole("button", { name: "預覽手機版" }).click();
  await expect(page.getByLabel("商品預覽")).toHaveAttribute("data-preview-mode", "mobile");

  await expect(page.getByRole("button", { name: "確認並上架" })).toBeDisabled();
  await page.getByLabel("我已確認內容，將上架這項商品").check();
  await page.getByRole("button", { name: "確認並上架" }).click();
  await expect(page.getByRole("heading", { name: "商品已上架" })).toBeVisible();
  await expect(page.getByText("已建立 1 個規格")).toBeVisible();
});

test("operator can complete the minimum fields and save a draft on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/admin/products/new");
  await completeMinimumProductDraft(page);

  const save = page.getByRole("button", { name: "儲存草稿" });
  await expect(save).toBeVisible();
  expect((await save.boundingBox())?.height).toBeGreaterThanOrEqual(48);
  await save.click();
  await expect(page.getByRole("status")).toContainText("草稿已儲存");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
