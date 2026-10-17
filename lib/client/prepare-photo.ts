/**
 * Phone photos (HEIC, 12–48MP JPEG) are re-encoded in the browser before upload so the server's
 * JPEG/PNG/WebP ≤ 5MB rule is met and request bodies stay small.
 */
export const PHOTO_MAX_EDGE = 1600;
export const PHOTO_JPEG_QUALITY = 0.82;
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const passThroughTypes = ["image/jpeg", "image/png", "image/webp"];

export type PreparedPhoto = { ok: true; dataUrl: string } | { ok: false; message: string };
export type PhotoPreparationDeps = {
  reencode: (file: Blob) => Promise<Blob | undefined>;
  readDataUrl: (blob: Blob) => Promise<string | undefined>;
};

export const UNREADABLE_PHOTO_MESSAGE = "這張照片無法讀取，請改選其他照片；iPhone 可到「設定 → 相機 → 格式」選「最相容」。";

export function scaledSize(width: number, height: number, maxEdge = PHOTO_MAX_EDGE): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const ratio = maxEdge / longest;
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

const readDataUrl = (blob: Blob): Promise<string | undefined> => new Promise((resolve) => {
  if (typeof FileReader === "undefined") { resolve(undefined); return; }
  const reader = new FileReader();
  reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
  reader.onerror = () => resolve(undefined);
  reader.readAsDataURL(blob);
});

const decode = async (file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void } | undefined> => {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch { /* fall back to an <img> element, which Safari decodes more broadly */ }
  }
  if (typeof Image === "undefined" || typeof URL.createObjectURL !== "function") return undefined;
  const url = URL.createObjectURL(file);
  const image = new Image();
  const loaded = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 15000);
    image.onload = () => { clearTimeout(timer); resolve(true); };
    image.onerror = () => { clearTimeout(timer); resolve(false); };
    image.src = url;
  });
  if (!loaded || image.naturalWidth === 0) { URL.revokeObjectURL(url); return undefined; }
  return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) };
};

const reencode = async (file: Blob): Promise<Blob | undefined> => {
  if (typeof document === "undefined") return undefined;
  const canvas = document.createElement("canvas");
  let context: CanvasRenderingContext2D | null = null;
  try { context = canvas.getContext("2d"); } catch { return undefined; }
  if (!context || typeof canvas.toBlob !== "function") return undefined;
  const decoded = await decode(file);
  if (!decoded) return undefined;
  try {
    const size = scaledSize(decoded.width, decoded.height);
    canvas.width = size.width;
    canvas.height = size.height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(decoded.source, 0, 0, size.width, size.height);
    return await new Promise<Blob | undefined>((resolve) => canvas.toBlob((blob) => resolve(blob ?? undefined), "image/jpeg", PHOTO_JPEG_QUALITY));
  } catch {
    return undefined;
  } finally {
    decoded.release();
  }
};

const defaultDeps: PhotoPreparationDeps = { reencode, readDataUrl };

export async function preparePhotoDataUrl(file: File, deps: PhotoPreparationDeps = defaultDeps): Promise<PreparedPhoto> {
  if (file.size === 0) return { ok: false, message: UNREADABLE_PHOTO_MESSAGE };
  const compressed = await deps.reencode(file).catch(() => undefined);
  if (compressed && compressed.size > 0 && compressed.size <= PHOTO_MAX_BYTES) {
    const dataUrl = await deps.readDataUrl(compressed);
    if (dataUrl?.startsWith("data:image/jpeg;base64,")) return { ok: true, dataUrl };
  }
  if (passThroughTypes.includes(file.type) && file.size <= PHOTO_MAX_BYTES) {
    const dataUrl = await deps.readDataUrl(file);
    if (dataUrl) return { ok: true, dataUrl };
  }
  return { ok: false, message: UNREADABLE_PHOTO_MESSAGE };
}
