import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { sandboxConfiguration } from "./config.ts";

function createSandboxAuth(bootstrapRegistration = false) {
  const configuration = sandboxConfiguration();
  mkdirSync(configuration.dataDirectory, { recursive: true });
  return betterAuth({
    secret: configuration.secret,
    baseURL: configuration.origin,
    trustedOrigins: [configuration.origin],
    database: new DatabaseSync(configuration.databasePath),
    emailAndPassword: { enabled: true, disableSignUp: !bootstrapRegistration, minPasswordLength: 8 },
    session: { expiresIn: 1800, updateAge: 300, cookieCache: { enabled: false } },
    advanced: { cookiePrefix: "tea-passkey-sandbox", useSecureCookies: configuration.origin.startsWith("https:") },
    rateLimit: { enabled: true, window: 60, max: 30 },
    logger: { disabled: true },
    plugins: [passkey({
      rpID: new URL(configuration.origin).hostname,
      rpName: "陳老師茶行獨立鎖頭沙盒",
      origin: configuration.origin,
      registration: { requireSession: true },
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
    })],
  });
}
type SandboxAuth = ReturnType<typeof createSandboxAuth>;
let instance: SandboxAuth | undefined;
export function getSandboxAuth(): SandboxAuth { return instance ??= createSandboxAuth(); }
/** Only startup provisioning can create the fixed private sandbox account. No HTTP handler uses this instance. */
export function createBootstrapAuth(): SandboxAuth {
  if (process.env.SANDBOX_BOOTSTRAP_ALLOWED !== "yes") throw new Error("未允許沙盒初次建立");
  return createSandboxAuth(true);
}
