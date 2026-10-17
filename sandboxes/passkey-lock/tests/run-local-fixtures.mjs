import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sandbox = resolve(fileURLToPath(new URL("..", import.meta.url)));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function command(args, env, inherit = false) {
  const child = spawn(process.execPath, args, { cwd: sandbox, env, stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"] });
  let output = "";
  if (!inherit) { child.stdout.on("data", chunk => { output += chunk; }); child.stderr.on("data", chunk => { output += chunk; }); }
  const code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", resolve); });
  if (code !== 0 && output) {
    for (const key of ["SANDBOX_SECRET", "SANDBOX_ACCESS_PASSWORD", "SANDBOX_BOOTSTRAP_PASSWORD"]) output = output.split(env[key]).join("[redacted]");
    console.error(output.slice(-4000));
  }
  assert.equal(code, 0, "Sandbox command must succeed: " + args[0]);
}
for (const merchantAllowed of [true, false]) {
  const directory = mkdtempSync(join(tmpdir(), "passkey-fixture-"));
  const env = { ...process.env,
    NODE_ENV: "development",
    SANDBOX_ORIGIN: "http://localhost:3142", SANDBOX_TEST_BASE_URL: "http://localhost:3142",
    SANDBOX_SECRET: randomBytes(32).toString("hex"),
    SANDBOX_ACCESS_PASSWORD: randomBytes(24).toString("hex"),
    SANDBOX_MERCHANT_USER_IDS: "",
    SANDBOX_BOOTSTRAP_EMAIL: merchantAllowed ? "allowed-merchant@example.test" : "outside-allowlist@example.test",
    SANDBOX_BOOTSTRAP_PASSWORD: randomBytes(24).toString("hex"),
    SANDBOX_BOOTSTRAP_ALLOWED: "yes",
    SANDBOX_DATA_DIR: join(directory, "passkey-lock"),
    SANDBOX_TEST_EXPECT_MERCHANT_ALLOWED: merchantAllowed ? "yes" : "no",
  };
  let server;
  let logs = "";
  try {
    console.log("Starting isolated virtual-authenticator fixture: merchantAllowed=" + merchantAllowed);
    await command(["--experimental-strip-types", "scripts/prepare.mjs"], env);
    const database = new DatabaseSync(join(env.SANDBOX_DATA_DIR, "auth.sqlite"));
    const vendorUser = database.prepare('SELECT id FROM "user" WHERE email = ?').get(env.SANDBOX_BOOTSTRAP_EMAIL);
    database.close();
    assert.ok(vendorUser?.id, "Server-only bootstrap must create the vendor user");
    env.SANDBOX_MERCHANT_USER_IDS = merchantAllowed ? vendorUser.id : "";
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3142"], { cwd: sandbox, env, stdio: ["ignore", "pipe", "pipe"] });
    server.stdout.on("data", chunk => { logs += chunk; });
    server.stderr.on("data", chunk => { logs += chunk; });
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (server.exitCode !== null) break;
      try {
        const response = await fetch(env.SANDBOX_ORIGIN + "/api/merchant-session", {
          headers: { authorization: "Basic " + Buffer.from("sandbox:" + env.SANDBOX_ACCESS_PASSWORD).toString("base64") },
          signal: AbortSignal.timeout(2000),
        });
        if (response.ok) { ready = true; break; }
      } catch { /* Wait for the isolated Next development server. */ }
      await delay(500);
    }
    assert.equal(ready, true, "Isolated sandbox must become ready");
    await command(["tests/webauthn-smoke.mjs"], env, true);
  } catch (error) {
    for (const key of ["SANDBOX_SECRET", "SANDBOX_ACCESS_PASSWORD", "SANDBOX_BOOTSTRAP_PASSWORD"]) logs = logs.split(env[key]).join("[redacted]");
    // Server output may contain vendor diagnostics; do not expose authentication data.
    console.error("Isolated sandbox fixture failed; server output was withheld.");
    const diagnostic = logs.match(/EADDRINUSE|Unable to acquire lock|Cannot find module [^\\r\\n]+|Module not found[^\\r\\n]*/);
    if (diagnostic) console.error("Startup diagnostic: " + diagnostic[0].slice(0, 200));
    console.error("Startup exit code: " + server?.exitCode);
    const startupText = logs.replace(new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g"), "");
    for (const line of startupText.split(String.fromCharCode(10)).filter(line => /(SyntaxError:|TypeError:|Error:|error:|Invalid|Unknown|Failed|error loading)/i.test(line))) console.error(line.slice(0, 200));
    console.error(error instanceof Error ? error.message : "Sandbox fixture failed");
    process.exitCode = 1;
  } finally {
    if (server) {
      if (process.platform === "win32") {
        await new Promise(resolve => { const kill = spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" }); kill.once("exit", resolve); kill.once("error", resolve); });
      } else {
        server.kill("SIGTERM");
        await new Promise(resolve => { if (server.exitCode !== null || server.signalCode) resolve(); else server.once("exit", resolve); });
      }
    }
    rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
  if (process.exitCode) break;
}
if (!process.exitCode) console.log("Both isolated virtual-authenticator fixtures passed; no tea order database was used.");
