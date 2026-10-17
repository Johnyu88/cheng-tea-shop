import { describe, expect, it, vi } from "vitest";
import { PHOTO_MAX_BYTES, preparePhotoDataUrl, scaledSize, UNREADABLE_PHOTO_MESSAGE, type PhotoPreparationDeps } from "@/lib/client/prepare-photo";

const jpegDataUrl = "data:image/jpeg;base64,/9j/AA==";
const file = (type: string, size = 1024, name = "tea") => new File([new Uint8Array(size)], name, { type });

describe("scaledSize", () => {
  it("keeps small photos and shrinks the longest edge to 1600px", () => {
    expect(scaledSize(800, 600)).toEqual({ width: 800, height: 600 });
    expect(scaledSize(8064, 6048)).toEqual({ width: 1600, height: 1200 });
    expect(scaledSize(3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });
});

describe("preparePhotoDataUrl", () => {
  it("uploads the re-encoded JPEG for an iPhone HEIC photo", async () => {
    const deps: PhotoPreparationDeps = {
      reencode: vi.fn().mockResolvedValue(new Blob([new Uint8Array(300_000)], { type: "image/jpeg" })),
      readDataUrl: vi.fn().mockResolvedValue(jpegDataUrl),
    };
    await expect(preparePhotoDataUrl(file("image/heic", 3_000_000, "IMG_0001.HEIC"), deps)).resolves.toEqual({ ok: true, dataUrl: jpegDataUrl });
  });

  it("re-encodes a JPEG larger than the server limit instead of rejecting it", async () => {
    const readDataUrl = vi.fn().mockResolvedValue(jpegDataUrl);
    const compressed = new Blob([new Uint8Array(400_000)], { type: "image/jpeg" });
    const result = await preparePhotoDataUrl(file("image/jpeg", PHOTO_MAX_BYTES + 1), { reencode: vi.fn().mockResolvedValue(compressed), readDataUrl });
    expect(result).toEqual({ ok: true, dataUrl: jpegDataUrl });
    expect(readDataUrl).toHaveBeenCalledWith(compressed);
  });

  it("falls back to the original file when the browser cannot re-encode a supported small photo", async () => {
    const original = file("image/png");
    const readDataUrl = vi.fn().mockResolvedValue("data:image/png;base64,iVBORw0KGgo=");
    await expect(preparePhotoDataUrl(original, { reencode: vi.fn().mockResolvedValue(undefined), readDataUrl })).resolves.toEqual({ ok: true, dataUrl: "data:image/png;base64,iVBORw0KGgo=" });
    expect(readDataUrl).toHaveBeenCalledWith(original);
  });

  it("returns a visible reason when an unsupported or oversized photo cannot be re-encoded", async () => {
    const deps: PhotoPreparationDeps = { reencode: vi.fn().mockRejectedValue(new Error("decode failed")), readDataUrl: vi.fn() };
    await expect(preparePhotoDataUrl(file("image/heic"), deps)).resolves.toEqual({ ok: false, message: UNREADABLE_PHOTO_MESSAGE });
    await expect(preparePhotoDataUrl(file("image/jpeg", PHOTO_MAX_BYTES + 1), deps)).resolves.toEqual({ ok: false, message: UNREADABLE_PHOTO_MESSAGE });
    expect(deps.readDataUrl).not.toHaveBeenCalled();
  });

  it("rejects empty files without reading them", async () => {
    const deps: PhotoPreparationDeps = { reencode: vi.fn(), readDataUrl: vi.fn() };
    await expect(preparePhotoDataUrl(file("image/jpeg", 0), deps)).resolves.toEqual({ ok: false, message: UNREADABLE_PHOTO_MESSAGE });
    expect(deps.reencode).not.toHaveBeenCalled();
  });
});
