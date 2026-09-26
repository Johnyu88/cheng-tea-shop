import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const port = 3013;
const merchantSecret = "11".repeat(32);

export default defineConfig({
  testDir: "./e2e-demo",
  reporter: "line",
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "on-first-retry" },
  webServer: {
    command: `corepack pnpm --config.verifyDepsBeforeRun=false dev --webpack --hostname 127.0.0.1 --port ${port}`,
    env: {
      DEMO_COMMERCE_LOCAL: "enabled",
      DEMO_MERCHANT_SECRET: merchantSecret,
      DEMO_DATA_DIR: resolve(`.demo-data/playwright-${process.pid}`),
      NEXT_PUBLIC_DEMO_COMMERCE: "enabled",
    },
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
});
