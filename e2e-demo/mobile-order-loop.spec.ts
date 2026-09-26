import { expect, test } from "@playwright/test";

const merchantSecret = process.env.DEMO_MERCHANT_SECRET ?? "11".repeat(32);

test("mobile synthetic order closes customer and merchant status loop", async ({ page }) => {
  await page.goto("/tea/taiwan-mi-xiang-wild-mountain-tea");
  await page.getByRole("button", { name: "加入購物車" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("button", { name: "返回上一頁" })).toBeVisible();
  await expect(page.getByRole("link", { name: "繼續購買" })).toHaveAttribute("href", "/#catalog");
  await page.getByRole("link", { name: "前往結帳" }).click();
  await expect(page.getByRole("link", { name: "取消本次結帳" })).toHaveAttribute("href", "/cart");

  await expect(page.getByRole("heading", { name: "身分確認" })).toBeVisible();
  await page.getByLabel("姓名").fill("合成顧客");
  await page.getByLabel("合成手機").fill("0912000001");
  await page.getByLabel("Email（選填，僅模擬通知）").fill("demo@example.test");
  await page.getByRole("button", { name: "取得合成驗證碼" }).click();
  await expect(page.getByRole("status")).toContainText("123456");
  await page.getByLabel("驗證碼").fill("000000");
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.locator("div[role=alert]").filter({ hasText: "驗證碼" })).toBeVisible();
  await page.getByLabel("驗證碼").fill("123456");
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("heading", { name: "配送與地址" })).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "建立示範訂單" }).click();
  await expect(page).toHaveURL(/\/checkout\/success\?order=DEMO-/);
  await expect(page.getByRole("heading", { name: "感謝您的購買" })).toBeVisible();
  await expect(page.getByText("已收到您的示範訂單，店家將依序處理。", { exact: true })).toBeVisible();
  const lookupHref = await page.getByRole("link", { name: "主動查看訂單" }).getAttribute("href");
  expect(lookupHref).toMatch(/^\/orders\?order=DEMO-/);
  expect(lookupHref).not.toContain("token=");

  await page.goto("/admin/orders");
  await page.getByLabel("獨立店家 Demo 密碼").fill(merchantSecret);
  await page.getByRole("button", { name: "確認店家身分" }).click();
  await expect(page.getByRole("heading", { name: "訂單成立" })).toBeVisible();
  await page.getByRole("button", { name: "模擬付款確認" }).click();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  await page.getByLabel("店家包裝照片").setInputFiles({ name: "packing.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("heading", { name: "已包裝／待出貨" })).toBeVisible();
  await page.getByRole("button", { name: "人工確認出貨" }).click();
  await expect(page.getByRole("heading", { name: "已出貨" })).toBeVisible();
  await page.getByRole("button", { name: "模擬成功" }).first().click();

  await page.goto(lookupHref!);
  await page.getByLabel("合成手機").fill("0912000001");
  await page.getByLabel("手機後三碼").fill("001");
  await page.getByRole("button", { name: "取得查單驗證碼" }).click();
  await expect(page.getByRole("status")).toContainText("123456");
  await page.getByLabel("驗證碼").fill("123456");
  await page.getByRole("button", { name: "查詢訂單" }).click();
  await expect(page.getByRole("heading", { name: "已出貨" })).toBeVisible();
  await expect(page.getByText("包裝照片：已由店家上傳")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(412);
});
