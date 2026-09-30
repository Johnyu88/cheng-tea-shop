import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const originalHost = "cheng-tea-private-preview.onrender.com";
export const fixedSeedOrderId = "DEMO-4acf58fa-843c-4e93-a909-ce4d7b134718";
/** Reconstructed synthetic fixture for a NEW independent preview; never a backup. */
export function seedIndependentDemo(directory: string, env: Readonly<Record<string, string | undefined>> = process.env): boolean {
  if (env.DEMO_FIXED_SEED !== "issue-24-yu-800" || env.DEMO_COMMERCE_CLOUD !== "enabled") return false;
  if (!env.RENDER_SERVICE_ID || env.RENDER_SERVICE_ID === "srv-dau9s69srm7s73bd3deg"
    || [env.DEMO_CLOUD_ORIGIN, env.RENDER_EXTERNAL_URL, env.RENDER_EXTERNAL_HOSTNAME].some(value => value?.includes(originalHost))) return false;
  mkdirSync(directory, { recursive: true });
  // Existing database files belong to the operator, even when empty; never modify them.
  if (existsSync(join(directory, "orders.sqlite")) || existsSync(join(directory, "identities.sqlite"))) return false;
  const db = new DatabaseSync(join(directory, "orders.sqlite"));
  try {
    db.prepare("ATTACH DATABASE ? AS identities").run(join(directory, "identities.sqlite"));
    db.exec("BEGIN IMMEDIATE");
    db.exec("CREATE TABLE IF NOT EXISTS demo_orders (order_id TEXT PRIMARY KEY, snapshot TEXT NOT NULL, secret_digest TEXT NOT NULL, notifications TEXT NOT NULL)");
    db.exec("CREATE TABLE IF NOT EXISTS identities.demo_order_identity (order_id TEXT PRIMARY KEY, phone_digest BLOB NOT NULL, name_digest BLOB)");
    const snapshot = {
      orderId: fixedSeedOrderId, status: "confirmed", paymentMethod: "bank-transfer",
      paymentStatus: "pending-manual-verification",
      lines: [{ productId: "synthetic-yu-800", variantId: "synthetic-yu-800-one", productName: "測試茶品（重建展示）",
        specification: "展示用", unitPrice: { currency: "TWD", amount: 800 }, quantity: 1 }],
      total: { currency: "TWD", amount: 800 }, packingPhotoId: null,
      events: [{ status: "confirmed", at: "2026-09-30T14:00:00.000Z" }],
    };
    const hash = (value: string) => createHash("sha256").update(value).digest();
    db.prepare("INSERT INTO demo_orders VALUES (?, ?, ?, ?)").run(fixedSeedOrderId, JSON.stringify(snapshot),
      hash(randomBytes(32).toString("hex")).toString("hex"), "[]");
    db.prepare("INSERT INTO identities.demo_order_identity VALUES (?, ?, ?)").run(fixedSeedOrderId,
      hash("local-demo-phone-v1:0912000000"), hash("local-demo-name-v1:Yu"));
    db.exec("COMMIT");
    return true;
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw error;
  } finally { db.close(); }
}
