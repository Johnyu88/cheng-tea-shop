import { expect, test } from "@playwright/test";

test("homepage assets load and a ninth demo product survives a reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("正式合成照尚未提供；目前不以其他照片替代。")).toBeVisible();
  await expect(page.getByLabel("茶園鳥鳴 2 音效")).toHaveAttribute("controls");
  await expect(page.locator("audio source")).toHaveAttribute("src", "/media/tea-stream-birds.wav");
  await expect(page.getByText("台灣蜜香野生山茶").first()).toBeVisible();

  const name = `第九種 UI 測試茶 ${Date.now()}`;
  await page.goto("/admin/products/new");
  await expect(page.getByRole("region", { name: "素材處理流程" })).toContainText("原始照片上傳");
  await expect(page.getByText("拆解／辨識結果（Mock）")).toBeVisible();
  await page.getByLabel("茶名").fill(name);
  await page.getByLabel("單一規格").fill("一兩");
  await page.getByLabel("價格（TWD）").fill("999");
  await page.getByLabel("茶類").selectOption("oolong");
  await page.getByLabel("有貨").check();
  await page.getByLabel("我已確認內容，將上架這項商品").check();
  await page.getByRole("button", { name: "確認並上架" }).click();
  await expect(page.getByRole("heading", { name: "商品已上架" })).toBeVisible();

  await page.reload();
  await page.goto("/");
  const productCard = page.locator("article").filter({ hasText: name });
  await expect(productCard).toBeVisible();
  await productCard.getByRole("link", { name: "查看茶品" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await page.getByRole("button", { name: "加入購物車" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByText(name)).toBeVisible();

  await page.goto("/admin/products");
  const adminRow = page.locator("article").filter({ hasText: name });
  await expect(adminRow).toBeVisible();
  await adminRow.getByRole("button", { name: "下架" }).click();
  await expect(adminRow).toContainText("已下架");
  await page.goto("/");
  await expect(page.locator("article").filter({ hasText: name })).toHaveCount(0);
});
