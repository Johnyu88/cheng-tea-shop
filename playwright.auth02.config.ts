import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const port = 3014;
const baseURL = `http://127.0.0.1:${port}`;
process.env.DEMO_AUTH02_LOCAL = "enabled";

export default defineConfig({
  testDir: "./e2e-demo",
  testMatch: "auth02-logout.spec.ts",
  workers: 1,
  reporter: "line",
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: `corepack pnpm --config.verifyDepsBeforeRun=false dev --webpack --hostname 127.0.0.1 --port ${port}`,
    env: {
      DEMO_COMMERCE_LOCAL: "enabled",
      DEMO_MERCHANT_SECRET: "11".repeat(32),
      DEMO_AUTH_PROVIDER: "",
      DEMO_AUTH_ENV: "",
      DEMO_AUTH_PASSWORD: "",
      DEMO_MERCHANT_PHONE: "",
      DEMO_MERCHANT_PHONE_CONFIRMED: "",
      DEMO_MERCHANT_SMS_MODE: "",
      DEMO_DATA_DIR: resolve(`.demo-data/auth02-${process.pid}`),
      NEXT_PUBLIC_DEMO_COMMERCE: "enabled",
    },
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
  },
  projects: [{ name: "auth02-mobile", use: { ...devices["Pixel 7"] } }],
});
