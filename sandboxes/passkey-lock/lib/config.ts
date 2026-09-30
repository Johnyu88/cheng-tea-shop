import { isAbsolute, basename, resolve } from "node:path";
export function sandboxConfiguration() {
  const origin = process.env.SANDBOX_ORIGIN ?? "";
  if (!["http://localhost:3142", "https://cheng-tea-passkey-sandbox.onrender.com"].includes(origin)) {
    throw new Error("沙盒來源未設定");
  }
  const secret = process.env.SANDBOX_SECRET ?? "";
  const accessPassword = process.env.SANDBOX_ACCESS_PASSWORD ?? "";
  const bootstrapEmail = (process.env.SANDBOX_BOOTSTRAP_EMAIL ?? "").toLowerCase();
  const merchantUserIds = (process.env.SANDBOX_MERCHANT_USER_IDS ?? "").split(",").map(id => id.trim()).filter(Boolean);
  if (merchantUserIds.some(id => !/^[a-zA-Z0-9_-]{8,128}$/.test(id))) throw new Error("沙盒授權識別碼無效");
  if (secret.length < 32 || accessPassword.length < 16
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bootstrapEmail)) throw new Error("沙盒安全設定不完整");
  const rawDirectory = process.env.SANDBOX_DATA_DIR ?? resolve(process.cwd(), ".data", "passkey-lock");
  if (!isAbsolute(rawDirectory) || !/^passkey-lock(?:-[a-zA-Z0-9_-]+)?$/.test(basename(rawDirectory))) {
    throw new Error("沙盒資料目錄必須獨立");
  }
  return { origin, secret, accessPassword, bootstrapEmail, merchantUserIds,
    databasePath: resolve(rawDirectory, "auth.sqlite"), dataDirectory: rawDirectory };
}
