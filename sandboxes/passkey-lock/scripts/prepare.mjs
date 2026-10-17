import { getMigrations } from "better-auth/db/migration";
import { getSandboxAuth, createBootstrapAuth } from "../lib/auth.ts";
import { sandboxConfiguration } from "../lib/config.ts";
import { DatabaseSync } from "node:sqlite";

try {
  const configuration = sandboxConfiguration();
  const auth = getSandboxAuth();
  const migrations = await getMigrations(auth.options);
  await migrations.runMigrations();
  const database = new DatabaseSync(configuration.databasePath);
  const existing = database.prepare('SELECT id FROM "user" WHERE email = ?').get(configuration.bootstrapEmail);
  database.close();
  if (!existing) {
    const password = process.env.SANDBOX_BOOTSTRAP_PASSWORD ?? "";
    if (password.length < 8 || password.length > 128) throw new Error("沙盒初次密碼未設定");
    await createBootstrapAuth().api.signUpEmail({
      body: { email: configuration.bootstrapEmail, password, name: "授權沙盒測試帳號" },
    });
  }
  console.info("Passkey sandbox database ready.");
  process.exit(0);
} catch {
  console.error("Passkey sandbox preparation failed; check isolated configuration.");
  process.exit(1);
}
