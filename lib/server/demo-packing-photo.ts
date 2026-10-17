import { randomUUID } from "node:crypto";
import { mkdir, lstat, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve, sep } from "node:path";

const maxBytes = 5 * 1024 * 1024;
const photoIdPattern = /^photo-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const orderIdPattern = /^DEMO-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
type Mime = "image/jpeg" | "image/png" | "image/webp";
type PhotoMeta = { orderId: string; mimeType: Mime };
type Access<Merchant> = {
  privateDirectory: string;
  authorize: (merchant: Merchant, orderId: string) => boolean | Promise<boolean>;
  orderExists: (orderId: string) => boolean | Promise<boolean>;
  recordPhoto: (orderId: string, photoId: string) => void | Promise<void>;
  isAttachedPhoto: (orderId: string, photoId: string) => boolean | Promise<boolean>;
};
function sniff(bytes: Buffer): Mime | null {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8
    && bytes[2] === 0xff && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "image/png";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF"
    && bytes.toString("ascii", 8, 12) === "WEBP"
    && bytes.readUInt32LE(4) === bytes.length - 8) return "image/webp";
  return null;
}
/** A server-only local demo file store; the caller must provide authoritative merchant access. */
export function createDemoPackingPhotoStore<Merchant>(access: Access<Merchant>) {
  const root = resolve(access.privateDirectory);
  if (root.split(sep).some(part => part.toLowerCase() === "public")
    || root.toLowerCase().includes(`${sep}.next${sep}static${sep}`)) {
    throw new Error("Packing photos require a private directory");
  }
  async function check(merchant: Merchant, orderId: string): Promise<void> {
    if (!orderIdPattern.test(orderId)
      || !(await access.authorize(merchant, orderId))
      || !(await access.orderExists(orderId))) throw new Error("Packing photo access denied");
  }
  return {
    async save(input: { merchant: Merchant; orderId: string; mimeType: string; bytes: Buffer }): Promise<string> {
      await check(input.merchant, input.orderId);
      if (!Buffer.isBuffer(input.bytes) || input.bytes.length === 0 || input.bytes.length > maxBytes
        || sniff(input.bytes) !== input.mimeType) throw new Error("Invalid packing photo");
      await mkdir(root, { recursive: true, mode: 0o700 });
      const photoId = `photo-${randomUUID()}`;
      const imagePath = join(root, `${photoId}.image`);
      const metaPath = join(root, `${photoId}.json`);
      try {
        await writeFile(imagePath, input.bytes, { flag: "wx", mode: 0o600 });
        await writeFile(metaPath, JSON.stringify({
          orderId: input.orderId, mimeType: input.mimeType,
        } satisfies PhotoMeta), { flag: "wx", mode: 0o600 });
        await access.recordPhoto(input.orderId, photoId);
      } catch (error) {
        await Promise.allSettled([rm(imagePath, { force: true }), rm(metaPath, { force: true })]);
        throw error;
      }
      return photoId;
    },
    async read(input: { merchant: Merchant; orderId: string; photoId: string }): Promise<{ bytes: Buffer; mimeType: Mime }> {
      await check(input.merchant, input.orderId);
      if (!photoIdPattern.test(input.photoId) || basename(input.photoId) !== input.photoId
        || !(await access.isAttachedPhoto(input.orderId, input.photoId))) {
        throw new Error("Packing photo access denied");
      }
      const metaPath = join(root, `${input.photoId}.json`);
      const imagePath = join(root, `${input.photoId}.image`);
      const [metaStat, imageStat] = await Promise.all([lstat(metaPath), lstat(imagePath)]);
      if (!metaStat.isFile() || !imageStat.isFile() || imageStat.size > maxBytes) {
        throw new Error("Invalid packing photo");
      }
      const meta: unknown = JSON.parse(await readFile(metaPath, "utf8"));
      if (typeof meta !== "object" || meta === null || !("orderId" in meta)
        || !("mimeType" in meta) || meta.orderId !== input.orderId
        || !["image/jpeg", "image/png", "image/webp"].includes(String(meta.mimeType))) {
        throw new Error("Packing photo access denied");
      }
      const bytes = await readFile(imagePath);
      if (sniff(bytes) !== meta.mimeType) throw new Error("Invalid packing photo");
      return { bytes, mimeType: meta.mimeType as Mime };
    },
  };
}
