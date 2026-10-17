import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { getMigrations } from "better-auth/db/migration";
import { createHmac, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

type Options = { origin: string; directory: string; secret: string };
type Binding = { user_id: string; email: string };
const domainKey = (secret: string, domain: string) => createHmac("sha256", Buffer.from(secret, "hex")).update(domain).digest("hex");
export function createMerchantPasskeyStore(options: Options) {
  mkdirSync(options.directory, { recursive: true });
  const db = new DatabaseSync(join(options.directory, "merchant-auth.sqlite"));
  const config = {
    secret: domainKey(options.secret, "chen-tea-merchant-passkey-auth-v1"),
    baseURL: options.origin, basePath: "/api/auth", trustedOrigins: [options.origin], database: db,
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
    session: { expiresIn: 1800, updateAge: 300, cookieCache: { enabled: false } },
    advanced: { cookiePrefix: "tea-merchant", useSecureCookies: options.origin.startsWith("https:") },
    rateLimit: { enabled: true, window: 60, max: 30 },
    logger: { disabled: true },
    plugins: [passkey({ rpID: new URL(options.origin).hostname, rpName: "陳老師茶行後台", origin: options.origin,
      registration: { requireSession: true }, authenticatorSelection: { residentKey: "required", userVerification: "required" } })],
  };
  const auth = betterAuth(config);
  const password = domainKey(options.secret, "chen-tea-merchant-passkey-bootstrap-password-v1");
  let ready: Promise<void> | undefined;
  const binding = () => db.prepare("SELECT user_id,email FROM tea_merchant_binding WHERE singleton = 1").get() as Binding | undefined;
  const prepare = () => ready ??= (async () => {
    await (await getMigrations(auth.options)).runMigrations();
    db.exec("CREATE TABLE IF NOT EXISTS tea_merchant_binding (singleton INTEGER PRIMARY KEY CHECK(singleton=1), user_id TEXT NOT NULL UNIQUE, email TEXT NOT NULL)");
    if (!binding()) {
      // This signup-enabled instance is never used by an HTTP handler.
      const bootstrap = betterAuth({ ...config, emailAndPassword: { ...config.emailAndPassword, disableSignUp: false } });
      const email = "merchant-" + randomUUID() + "@example.invalid";
      const created = await bootstrap.api.signUpEmail({ body: { email, password, name: "陳老師茶行管理員" } });
      db.prepare("INSERT INTO tea_merchant_binding (singleton,user_id,email) VALUES (1,?,?)").run(created.user.id, email);
    }
    const bound = binding();
    if (!bound || !db.prepare('SELECT id FROM "user" WHERE id = ? AND email = ?').get(bound.user_id, bound.email)) throw new Error("Merchant binding unavailable");
  })();
  return {
    auth, prepare,
    async enroll() { await prepare(); return auth.api.signInEmail({ body: { email: binding()!.email, password }, asResponse: true }); },
    async authorized(headers: Headers) {
      await prepare();
      const session = await auth.api.getSession({ headers });
      return !!session && session.user.id === binding()!.user_id && new Date(session.session.expiresAt).getTime() > Date.now();
    },
    async status() { await prepare(); return { enabled: true, registered: !!db.prepare('SELECT id FROM passkey WHERE "userId" = ? LIMIT 1').get(binding()!.user_id) }; },
    close() { db.close(); },
  };
}
type Store = ReturnType<typeof createMerchantPasskeyStore>;
const stores = new Map<string, Store>();
export function getMerchantPasskeyStore(): Store | null {
  const cloud = process.env.DEMO_COMMERCE_CLOUD === "enabled";
  const rawOrigin = cloud ? process.env.DEMO_CLOUD_ORIGIN || process.env.RENDER_EXTERNAL_URL : process.env.DEMO_PASSKEY_LOCAL_ORIGIN;
  const secret = process.env.DEMO_MERCHANT_SECRET ?? "";
  if (!rawOrigin || !/^[a-fA-F0-9]{64}$/.test(secret)) return null;
  const origin = new URL(rawOrigin);
  if (origin.origin !== rawOrigin || origin.username || origin.password || origin.search || origin.hash) return null;
  if (cloud ? rawOrigin !== "https://cheng-tea-password-demo.onrender.com" || process.env.DEMO_AUTH_ENV !== "isolated-demo"
    || process.env.DEMO_AUTH_PROVIDER !== "password" || (process.env.DEMO_AUTH_PASSWORD ?? "").length < 3
    : process.env.DEMO_COMMERCE_LOCAL !== "enabled" || origin.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(origin.hostname)) return null;
  const directory = resolve(process.env.DEMO_DATA_DIR || ".demo-data/local");
  const key = [rawOrigin, directory, secret].join("|");
  if (!stores.has(key)) stores.set(key, createMerchantPasskeyStore({ origin: rawOrigin, directory, secret }));
  return stores.get(key)!;
}

