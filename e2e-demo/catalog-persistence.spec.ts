import { expect, test } from "@playwright/test";

test("homepage assets load and a ninth demo product survives a reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("img", { name: "陳老師茶行首頁合成照" })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "訂單查詢" })).toHaveAttribute("href", "/orders");
  await expect(page.getByLabel("茶園鳥鳴 2 音效")).toHaveAttribute("controls");
  await expect(page.locator("audio source")).toHaveAttribute("src", "/media/tea-stream-birds.wav");
  await expect(page.getByText("台灣蜜香野生山茶").first()).toBeVisible();

  const name = `第九種 UI 測試茶 ${Date.now()}`;
  await page.goto("/admin/products/new");
  await expect(page.getByRole("heading", { name: "新增商品" })).toBeVisible();
  await expect(page.getByText("照片由店家自行拍攝或於外部工具處理後上傳")).toBeVisible();
  await page.getByLabel("茶名").fill(name);
  await page.getByLabel("規格").fill("一兩");
  await page.getByLabel("價格（TWD）").fill("999");
  await page.getByLabel("茶類").selectOption("oolong");
  await page.getByLabel("庫存").selectOption("available");
  await page.getByLabel("我已確認照片與商品資料").check();
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
  await adminRow.getByRole("button", { name: "編輯" }).click();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  await adminRow.getByLabel("選擇新照片以更換").setInputFiles({ name: "replacement.png", mimeType: "image/png", buffer: png });
  page.once("dialog", (dialog) => dialog.accept());
  await adminRow.getByRole("button", { name: "儲存編輯" }).click();
  await expect(page.getByText("與照片已儲存。", { exact: false })).toBeVisible();
  await page.reload();
  const reloadedRow = page.locator("article").filter({ hasText: name });
  await expect(reloadedRow).toBeVisible();
  await reloadedRow.getByRole("button", { name: "編輯", exact: true }).click();
  await expect(reloadedRow.getByRole("img", { name: `目前照片：${name}` })).toBeVisible();
  await reloadedRow.getByRole("button", { name: "編輯", exact: true }).click();
  await adminRow.getByRole("button", { name: "下架" }).click();
  await expect(reloadedRow).toContainText("草稿／未上架");
  await page.goto("/");
  await expect(page.locator("article").filter({ hasText: name })).toHaveCount(0);
});
