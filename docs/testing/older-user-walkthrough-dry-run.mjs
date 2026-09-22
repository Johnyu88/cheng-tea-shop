import { chromium } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
const viewports = [
  { name: "mobile-360x800", width: 360, height: 800 },
  { name: "desktop-1280x800", width: 1280, height: 800 },
];

const results = [];

async function runTask(page, viewport, id, action) {
  const started = Date.now();
  console.log(`${viewport} ${id} START`);
  try {
    await action();
    const result = { viewport, task: id, status: "PASS", durationMs: Date.now() - started };
    results.push(result);
    console.log(`${viewport} ${id} PASS ${result.durationMs}ms`);
  } catch (error) {
    const result = { viewport, task: id, status: "FAIL", durationMs: Date.now() - started, error: String(error) };
    results.push(result);
    console.log(`${viewport} ${id} FAIL ${result.durationMs}ms ${result.error}`);
  }
}

async function runViewport(viewport) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);

  await runTask(page, viewport.name, "T1", async () => {
    await page.goto(`${baseURL}/`);
    await page.getByRole("link", { name: "查看茶品" }).first().waitFor();
    await page.getByRole("link", { name: "查看茶品" }).first().click();
    await page.getByRole("heading", { level: 1, name: "合成茶品 001" }).waitFor();
    await page.getByText("商品照片準備中").waitFor();
  });

  await runTask(page, viewport.name, "T2", async () => {
    await page.getByRole("button", { name: "增加數量" }).click();
    await page.getByRole("button", { name: "加入購物車" }).click();
    await page.getByRole("status").filter({ hasText: "已加入購物車" }).waitFor();
    await page.getByRole("link", { name: "查看購物車" }).click();
    await page.getByRole("region", { name: "購物車摘要" }).filter({ hasText: "小計：NT$1,020" }).waitFor();
  });

  await runTask(page, viewport.name, "T3", async () => {
    await page.getByRole("link", { name: "前往結帳" }).click();
    await page.getByRole("heading", { name: "聯絡資料" }).waitFor();
    await page.getByLabel("姓名").fill("陳小姐");
    await page.getByLabel("手機號碼").fill("0912000000");
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByLabel("宅配地址").fill("茶行路 1 號");
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByRole("heading", { name: "確認訂單" }).waitFor();
  });

  await runTask(page, viewport.name, "T4", async () => {
    await page.getByRole("button", { name: "返回配送方式" }).click();
    await page.getByRole("button", { name: "上一步" }).click();
    await page.getByLabel("手機號碼").fill("");
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByRole("alert").filter({ hasText: "請填寫手機號碼" }).waitFor();
    await page.getByLabel("手機號碼").fill("0912000000");
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByLabel("宅配地址").waitFor();
  });

  await runTask(page, viewport.name, "T5", async () => {
    await page.goBack();
    await page.getByRole("heading", { name: "購物車" }).waitFor();
    await page.getByText("合成茶品 001").first().waitFor();
    if (await page.getByRole("spinbutton", { name: "合成茶品 001數量" }).inputValue() !== "2") throw new Error("cart quantity was not preserved");
  });

  await runTask(page, viewport.name, "T6", async () => {
    await page.goto(`${baseURL}/admin/products/new`);
    await page.locator("main[data-hydrated='true']").waitFor();
    await page.getByLabel("茶名").fill("春茶");
    await page.getByLabel("單一規格").fill("150g");
    await page.getByLabel("價格（TWD）").fill("1200");
    await page.getByLabel("茶類").selectOption("oolong");
    await page.getByLabel("有貨").check();
    await page.getByRole("button", { name: "儲存草稿" }).click();
    await page.getByRole("status").filter({ hasText: "草稿已儲存" }).waitFor();
  });

  await runTask(page, viewport.name, "T7", async () => {
    await page.getByRole("button", { name: "產生介紹草稿" }).click();
    await page.getByLabel("商品介紹草稿（可編輯）").waitFor();
    await page.getByRole("button", { name: "預覽電腦版" }).click();
    await page.getByLabel("商品預覽").waitFor();
    await page.getByRole("button", { name: "預覽手機版" }).click();
  });

  await runTask(page, viewport.name, "T8", async () => {
    await page.getByRole("button", { name: "確認並上架" }).waitFor();
    if (!(await page.getByRole("button", { name: "確認並上架" }).isDisabled())) throw new Error("publish button was not confirmation-gated");
    await page.getByLabel("我已確認內容，將上架這項商品").check();
    await page.getByRole("button", { name: "確認並上架" }).click();
    await page.getByRole("heading", { name: "商品已上架" }).waitFor();
  });

  await context.close();
  await browser.close();
}

for (const viewport of viewports) await runViewport(viewport);
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.status === "FAIL")) process.exitCode = 1;
