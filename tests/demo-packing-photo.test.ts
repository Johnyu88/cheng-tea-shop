import { afterEach, describe, expect, test } from "vitest";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDemoPackingPhotoStore } from "@/lib/server/demo-packing-photo";

const orderId = "DEMO-00000000-0000-4000-8000-000000000001";
const otherId = "DEMO-00000000-0000-4000-8000-000000000002";
const image = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0xff, 0xd9]);
const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "packing-photo-"));
  directories.push(directory);
  const attached = new Map<string, string>();
  const known = new Set([orderId, otherId]);
  const options = {
    privateDirectory: join(directory, "private"),
    authorize: (merchant: string, order: string) => merchant === "merchant-1" && known.has(order),
    orderExists: (order: string) => known.has(order),
    recordPhoto: (order: string, photo: string) => { attached.set(order, photo); },
    isAttachedPhoto: (order: string, photo: string) => attached.get(order) === photo,
  };
  return { options, attached };
}
describe("private packing photo store", () => {
  test("persists by opaque photo id across store recreation, bound to one order", async () => {
    const { options } = await fixture();
    const first = createDemoPackingPhotoStore(options);
    const id = await first.save({ merchant: "merchant-1", orderId, mimeType: "image/jpeg", bytes: image });
    expect(id).toMatch(/^photo-[0-9a-f-]{36}$/);
    const second = createDemoPackingPhotoStore(options);
    expect((await second.read({ merchant: "merchant-1", orderId, photoId: id })).bytes).toEqual(image);
    const metadata = await readFile(join(options.privateDirectory, `${id}.json`), "utf8");
    expect(metadata).toContain(orderId);
    expect(metadata).not.toMatch(/0912000000|address|customerName/);
    await expect(second.read({ merchant: "merchant-1", orderId: otherId, photoId: id })).rejects.toThrow();
    await expect(second.read({ merchant: "stranger", orderId, photoId: id })).rejects.toThrow();
    await expect(second.read({ merchant: "merchant-1", orderId, photoId: "../secret" })).rejects.toThrow();
  });
  test("rejects missing order, unauthorized writer, MIME forgery and overlarge file", async () => {
    const { options } = await fixture();
    const store = createDemoPackingPhotoStore(options);
    const request = { merchant: "merchant-1", orderId, mimeType: "image/jpeg", bytes: image };
    await expect(store.save({ ...request, merchant: "stranger" })).rejects.toThrow();
    await expect(store.save({ ...request, orderId: "DEMO-missing" })).rejects.toThrow();
    await expect(store.save({ ...request, mimeType: "image/png" })).rejects.toThrow();
    await expect(store.save({ ...request, bytes: Buffer.from("not an image") })).rejects.toThrow();
    await expect(store.save({ ...request, bytes: Buffer.alloc(5 * 1024 * 1024 + 1) })).rejects.toThrow();
    await expect(readdir(options.privateDirectory)).rejects.toThrow();
  });
  test("cleans both files if the order attachment fails", async () => {
    const { options } = await fixture();
    const store = createDemoPackingPhotoStore({
      ...options, recordPhoto: () => { throw new Error("Order persistence failed"); },
    });
    await expect(store.save({ merchant: "merchant-1", orderId, mimeType: "image/jpeg", bytes: image }))
      .rejects.toThrow("Order persistence failed");
    expect(await readdir(options.privateDirectory)).toEqual([]);
  });
  test("denies orphaned photo and public file roots", async () => {
    const { options, attached } = await fixture();
    const store = createDemoPackingPhotoStore(options);
    const id = await store.save({ merchant: "merchant-1", orderId, mimeType: "image/jpeg", bytes: image });
    attached.clear();
    await expect(store.read({ merchant: "merchant-1", orderId, photoId: id })).rejects.toThrow();
    expect(() => createDemoPackingPhotoStore({ ...options, privateDirectory: join(options.privateDirectory, "public", "photos") }))
      .toThrow("private directory");
  });
});
