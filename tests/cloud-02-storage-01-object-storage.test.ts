import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { Pool } from "pg";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { createS3ObjectStorage } from "@/lib/server/s3-object-storage";
import { createPostgresPhotoRepository } from "@/lib/server/postgres-photo-repository";

const endpoint = process.env.CLOUD02_S3_ENDPOINT;
const databaseUrl = process.env.CLOUD02_DB_URL;
const pool = new Pool({ connectionString: databaseUrl });
const schema = readFileSync(resolve(process.cwd(), "docs/architecture/cloud-02-postgresql-schema.sql"), "utf8");
const db01 = readFileSync(resolve(process.cwd(), "docs/architecture/cloud-02-db-01-contract-migration.sql"), "utf8");
const db02 = readFileSync(resolve(process.cwd(), "docs/architecture/cloud-02-db-02-adapter-migration.sql"), "utf8");
const storageMigration = readFileSync(resolve(process.cwd(), "docs/architecture/cloud-02-storage-01-migration.sql"), "utf8");
const ids = { product: "00000000-0000-0000-0000-000000000001", variant: "00000000-0000-0000-0000-000000000002", order: "00000000-0000-0000-0000-000000000003", actor: "00000000-0000-0000-0000-000000000005" };
const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const digest = createHash("sha256").update(bytes).digest("hex");
const query = (text: string, values: unknown[] = []) => pool.query(text, values);

async function reset() {
  await query("DROP SCHEMA public CASCADE"); await query("CREATE SCHEMA public"); await query(schema); await query(db01); await query(db02); await query(storageMigration);
  await query("INSERT INTO products(id,slug,name,category,summary,publication_status) VALUES($1,'storage-tea','Storage Tea','black','Synthetic storage fixture','published')", [ids.product]);
  await query("INSERT INTO product_variants(id,product_id,specification,price_amount,inventory_quantity) VALUES($1,$2,'one pack',100,2)", [ids.variant, ids.product]);
}

describe.skipIf(!endpoint || !databaseUrl)("CLOUD-02 STORAGE-01 real S3-compatible storage", () => {
  let storage: ReturnType<typeof createS3ObjectStorage>; let photos: ReturnType<typeof createPostgresPhotoRepository>;
  beforeAll(async () => { storage = createS3ObjectStorage({ enabled: true, endpoint: endpoint!, region: "us-east-1", bucket: process.env.CLOUD02_S3_BUCKET || "cloud02-test", accessKeyId: process.env.CLOUD02_S3_ACCESS_KEY || "minioadmin", secretAccessKey: process.env.CLOUD02_S3_SECRET_KEY || "minioadmin", forcePathStyle: true }); await storage.ensureBucket(); photos = createPostgresPhotoRepository(pool, storage); });
  beforeEach(reset); afterAll(() => pool.end());

  it("stores and reads real bytes with MIME, size and SHA-256 verification", async () => { const object = await storage.put({ scope: "product", ownerId: ids.product, bytes, mimeType: "image/png", extension: "png" }); expect(object.byteLength).toBe(bytes.length); expect(object.sha256Hex).toBe(digest); await expect(storage.get(object.key, { authorized: true })).resolves.toEqual(expect.objectContaining({ bytes, mimeType: "image/png", sha256Hex: digest })); });
  it("reads the same object after recreating the storage adapter", async () => { const object = await storage.put({ scope: "product", ownerId: ids.product, bytes, mimeType: "image/png" }); const restarted = createS3ObjectStorage({ enabled: true, endpoint: endpoint!, region: "us-east-1", bucket: process.env.CLOUD02_S3_BUCKET || "cloud02-test", accessKeyId: process.env.CLOUD02_S3_ACCESS_KEY || "minioadmin", secretAccessKey: process.env.CLOUD02_S3_SECRET_KEY || "minioadmin", forcePathStyle: true }); await expect(restarted.get(object.key, { authorized: true })).resolves.toEqual(expect.objectContaining({ bytes, sha256Hex: digest })); });
  it("denies private reads and detects missing or tampered objects", async () => { const object = await storage.put({ scope: "packing", ownerId: ids.order, bytes, mimeType: "image/png", extension: "png" }); await expect(storage.get(object.key, { authorized: false })).rejects.toThrow(/authorized/i); await expect(storage.get("missing/object", { authorized: true })).rejects.toThrow(); await storage.delete(object.key); await expect(storage.get(object.key, { authorized: true })).rejects.toThrow(); });
  it("keeps old product version when replacing an image", async () => { const first = await photos.replaceProductImage({ productId: ids.product, bytes, mimeType: "image/png", altText: "first" }); const secondBytes = Buffer.concat([bytes, Buffer.from("v2")]); const second = await photos.replaceProductImage({ productId: ids.product, bytes: secondBytes, mimeType: "image/png", altText: "second" }); expect(second.key).not.toBe(first.key); expect((await query("SELECT count(*)::int AS n FROM product_images WHERE product_id=$1", [ids.product])).rows[0].n).toBe(2); expect((await storage.get(first.key, { authorized: true })).bytes).toEqual(bytes); });
  it("commits packing metadata only after object upload and retains checksum/version", async () => { await query("BEGIN"); await query("INSERT INTO orders(id,order_number,customer_name,phone_digest,delivery_method,payment_method,subtotal_amount,shipping_amount,total_amount,lookup_digest) VALUES($1,'261016-901','Synthetic','a','store_pickup','cash',100,0,100,'b')", [ids.order]); await query("INSERT INTO order_items(id,order_id,product_id,variant_id,product_name_snapshot,specification_snapshot,unit_price_amount,quantity,line_total_amount) VALUES($1,$2,$3,$4,'Storage Tea','one pack',100,1,100)", ["00000000-0000-0000-0000-000000000006", ids.order, ids.product, ids.variant]); await query("INSERT INTO payments(id,order_id,method,status,amount) VALUES($1,$2,'cash','confirmed',100)", ["00000000-0000-0000-0000-000000000007", ids.order]); await query("COMMIT"); await query("SELECT transition_cloud02_order($1,'payment_confirmed',$2,'staff','payment-test','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')", [ids.order, ids.actor]); const photo = await photos.addPackingPhoto({ orderId: ids.order, actorId: ids.actor, bytes, mimeType: "image/png" }); expect(photo.sha256Hex).toBe(digest); expect((await query("SELECT object_key,sha256_hex,confirmed_by FROM packing_photos WHERE order_id=$1", [ids.order])).rows[0]).toMatchObject({ object_key: photo.key, sha256_hex: digest, confirmed_by: ids.actor }); });
  it("compensates an uploaded object when the database transaction fails", async () => { await expect(photos.addPackingPhoto({ orderId: "00000000-0000-0000-0000-000000000099", actorId: ids.actor, bytes, mimeType: "image/png" })).rejects.toThrow(); const objects = await storage.list("packing"); expect(objects.some(object => object.ownerId.endsWith("0099"))).toBe(false); });
  it("fails closed before the database write when object validation fails", async () => { await expect(photos.replaceProductImage({ productId: ids.product, bytes: Buffer.from("not-an-image"), mimeType: "image/jpeg", altText: "rejected" })).rejects.toThrow(/MIME|image/i); expect((await query("SELECT count(*)::int AS n FROM product_images WHERE product_id=$1", [ids.product])).rows[0].n).toBe(0); });
  it("creates a manifest, restores to a new prefix and detects a missing object", async () => { const product = await photos.replaceProductImage({ productId: ids.product, bytes, mimeType: "image/png", altText: "manifest" }); const manifest = await photos.createManifest("storage-test"); expect(manifest.count).toBe(1); const restored = await photos.restoreManifest(manifest.id, "restore"); expect(restored.missing).toEqual([]); await storage.delete(product.key); const damaged = await photos.verifyManifest(manifest.id); expect(damaged.missing).toContain(product.key); });
  it("rejects MIME mismatch and preserves Demo as the default", async () => { await expect(storage.put({ scope: "product", ownerId: ids.product, bytes: Buffer.from("not-an-image"), mimeType: "image/jpeg", extension: "jpg" })).rejects.toThrow(/MIME|image/i); expect(process.env.CLOUD02_HTTP_MODE).not.toBe("candidate"); });
});
