import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const port = 3013;
const merchantSecret = "11".repeat(32);
const baseURL = process.env.DEMO_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e-demo",
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
      // Password provider is cloud-only; local regression explicitly exercises SMS.
      DEMO_AUTH_PROVIDER: "sms",
      DEMO_AUTH_ENV: "",
      DEMO_AUTH_PASSWORD: "",
      DEMO_DATA_DIR: resolve(`.demo-data/playwright-${process.pid}`),
      NEXT_PUBLIC_DEMO_COMMERCE: "enabled",
    },
    url: `${baseURL}/api/health`,
    reuseExistingServer: Boolean(process.env.DEMO_BASE_URL),
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
});
