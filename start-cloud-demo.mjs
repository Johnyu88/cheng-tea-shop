import { assertDemoEnabled, cloudDemoRequested } from "./lib/server/demo-cloud.ts";
if (!cloudDemoRequested()) throw new Error("Private preview mode must be explicitly enabled");
assertDemoEnabled();
process.env.HOSTNAME = "0.0.0.0";
await import("./scripts/start-playwright-standalone.mjs");
