import { createHash, randomUUID } from "node:crypto";
import { CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutBucketVersioningCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type Mime = "image/jpeg" | "image/png" | "image/webp";
type Options = { enabled: boolean; endpoint?: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string; forcePathStyle?: boolean; maxBytes?: number };
export type StoredObject = { key: string; versionId: string | null; mimeType: Mime; byteLength: number; sha256Hex: string; ownerId: string };
const sniff = (bytes: Buffer): Mime | null => {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
};
const extension = (mime: Mime) => mime === "image/jpeg" ? "jpg" : mime.slice("image/".length);

export function createS3ObjectStorage(options: Options) {
  if (!options.enabled || !options.endpoint || !options.bucket || !options.accessKeyId || !options.secretAccessKey) throw new Error("S3 object storage is disabled or incomplete");
  const client = new S3Client({ endpoint: options.endpoint, region: options.region, forcePathStyle: options.forcePathStyle ?? true, credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey } });
  const maxBytes = options.maxBytes ?? 10 * 1024 * 1024;
  const head = async (key: string) => client.send(new HeadObjectCommand({ Bucket: options.bucket, Key: key }));
  return {
    async ensureBucket() {
      try { await client.send(new CreateBucketCommand({ Bucket: options.bucket })); } catch (error) { const code = (error as { name?: string }).name; if (code !== "BucketAlreadyOwnedByYou" && code !== "BucketAlreadyExists") throw error; }
      await client.send(new PutBucketVersioningCommand({ Bucket: options.bucket, VersioningConfiguration: { Status: "Enabled" } }));
    },
    async put(input: { scope: "product" | "packing"; ownerId: string; bytes: Buffer; mimeType: Mime; extension?: string }): Promise<StoredObject> {
      if (input.bytes.length === 0 || input.bytes.length > maxBytes || sniff(input.bytes) !== input.mimeType) throw new Error("MIME or size validation failed");
      const sha256Hex = createHash("sha256").update(input.bytes).digest("hex"); const key = `${input.scope}/${input.ownerId}/${randomUUID()}.${input.extension || extension(input.mimeType)}`;
      const result = await client.send(new PutObjectCommand({ Bucket: options.bucket, Key: key, Body: input.bytes, ContentType: input.mimeType, ContentLength: input.bytes.length, Metadata: { sha256: sha256Hex, owner: input.ownerId }, ChecksumSHA256: createHash("sha256").update(input.bytes).digest("base64") }));
      const metadata = await head(key);
      return { key, versionId: result.VersionId || metadata.VersionId || null, mimeType: input.mimeType, byteLength: input.bytes.length, sha256Hex, ownerId: input.ownerId };
    },
    async get(key: string, access: { authorized: boolean }): Promise<{ bytes: Buffer; mimeType: Mime; sha256Hex: string; versionId: string | null }> {
      if (!access.authorized) throw new Error("Object access not authorized");
      const response = await client.send(new GetObjectCommand({ Bucket: options.bucket, Key: key })); const bytes = Buffer.from(await response.Body!.transformToByteArray()); const mimeType = response.ContentType as Mime; const sha256Hex = createHash("sha256").update(bytes).digest("hex");
      if (!sniff(bytes) || sniff(bytes) !== mimeType || response.Metadata?.sha256 !== sha256Hex) throw new Error("Object checksum or MIME mismatch");
      return { bytes, mimeType, sha256Hex, versionId: response.VersionId || null };
    },
    async delete(key: string) { await client.send(new DeleteObjectCommand({ Bucket: options.bucket, Key: key })); },
    async list(scope: "product" | "packing"): Promise<Array<{ key: string; ownerId: string; versionId: string | null; sha256Hex: string; byteLength: number; mimeType: Mime }>> {
      const listed = await client.send(new ListObjectsV2Command({ Bucket: options.bucket, Prefix: `${scope}/` })); const result: Array<{ key: string; ownerId: string; versionId: string | null; sha256Hex: string; byteLength: number; mimeType: Mime }> = [];
      for (const item of listed.Contents || []) { if (!item.Key) continue; const metadata = await head(item.Key); result.push({ key: item.Key, ownerId: item.Key.split("/")[1] || "", versionId: metadata.VersionId || null, sha256Hex: metadata.Metadata?.sha256 || "", byteLength: Number(metadata.ContentLength || 0), mimeType: metadata.ContentType as Mime }); }
      return result;
    },
  };
}
