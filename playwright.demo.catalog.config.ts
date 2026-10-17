import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const port = 3015;
const merchantSecret = "11".repeat(32);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e-demo",
  testMatch: "catalog-persistence.spec.ts",
  workers: 1,
  reporter: "line",
  use: { baseURL, trace: "on-first-retry" },
  webServer: {
    command: `corepack pnpm --config.verifyDepsBeforeRun=false dev --webpack --hostname 127.0.0.1 --port ${port}`,
    env: {
      DEMO_COMMERCE_LOCAL: "enabled",
      DEMO_MERCHANT_SECRET: merchantSecret,
      DEMO_MERCHANT_PHONE: "0912000000",
      DEMO_MERCHANT_PHONE_CONFIRMED: "yes",
      DEMO_MERCHANT_SMS_MODE: "simulated",
      // A dedicated server isolates the merchant OTP cooldown from the order loop.
      DEMO_AUTH_PROVIDER: "sms",
      DEMO_AUTH_ENV: "",
      DEMO_AUTH_PASSWORD: "",
      DEMO_DATA_DIR: resolve(`.demo-data/playwright-catalog-${process.pid}`),
      PUBLIC_CATALOG_VISIBILITY_PATH: resolve(`.demo-data/playwright-catalog-${process.pid}/public/publication.json`),
      NEXT_PUBLIC_DEMO_COMMERCE: "enabled",
    },
    url: `${baseURL}/api/health`,
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
});
