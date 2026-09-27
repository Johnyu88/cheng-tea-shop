import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import type { Product, ProductDraft } from "@/lib/domain";
import { confirmedTeaFixture } from "@/lib/domain/mock/confirmed-tea-fixture";
import { mockCatalogFixture } from "@/lib/domain/mock/catalog-fixture";

type CatalogFile = { version: 1; products: Product[] };
type StoreOptions = { filePath: string; mediaDirectory: string; seedProducts?: Product[] };
export type ProductUpdate = {
  name?: string;
  category?: Product["category"];
  specification?: string;
  price?: Product["variants"][number]["price"];
  inventoryStatus?: Product["variants"][number]["inventoryStatus"];
  aroma?: string;
  taste?: string;
  teaRegion?: string;
  summary?: string;
  fermentation?: string;
  roast?: string;
  brewing?: string;
  tasteTags?: Product["tasteTags"];
  imageDataUrl?: string;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const slugFor = (name: string, id: string): string => {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "demo-tea"}-${id.slice(-8)}`;
};

const decodePhoto = (dataUrl: string): { extension: string; bytes: Buffer } | undefined => {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return undefined;
  const extension = match[1] === "image/jpeg" ? "jpg" : match[1]!.slice("image/".length);
  return { extension, bytes: Buffer.from(match[2]!, "base64") };
};

export const createDemoCatalogStore = ({ filePath, mediaDirectory, seedProducts = confirmedTeaFixture }: StoreOptions) => {
  let queue = Promise.resolve();

  const read = async (): Promise<CatalogFile> => {
    await mkdir(dirname(filePath), { recursive: true });
    try {
      return JSON.parse(await readFile(filePath, "utf8")) as CatalogFile;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const initial = { version: 1 as const, products: clone(seedProducts) };
      await writeFile(filePath, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
  };

  const write = async (catalog: CatalogFile): Promise<void> => {
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(catalog, null, 2), "utf8");
    await rename(temporaryPath, filePath);
  };

  const serialized = async <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation, operation);
    queue = result.then(() => undefined, () => undefined);
    return result;
  };

  return {
    async list(): Promise<Product[]> {
      const catalog = await read();
      return clone(catalog.products);
    },
    async getBySlug(slug: string): Promise<Product | undefined> {
      const products = await this.list();
      return products.find((product) => product.slug === slug);
    },
    async setPublication(id: string, publication: Product["publication"]): Promise<Product | undefined> {
      return serialized(async () => {
        const catalog = await read();
        const product = catalog.products.find((item) => item.id === id);
        if (!product) return undefined;
        product.publication = publication;
        await write(catalog);
        return clone(product);
      });
    },
    async update(id: string, changes: ProductUpdate): Promise<Product | undefined> {
      return serialized(async () => {
        const catalog = await read();
        const product = catalog.products.find((item) => item.id === id);
        if (!product) return undefined;
        if (changes.imageDataUrl !== undefined) {
          const decoded = decodePhoto(changes.imageDataUrl);
          if (!decoded || decoded.bytes.length === 0 || decoded.bytes.length > 5 * 1024 * 1024) throw new Error("商品照片只接受 JPEG、PNG、WebP，且不可超過 5MB。原照片已保留。");
          await mkdir(mediaDirectory, { recursive: true });
          const fileName = `${product.id}-photo-${randomUUID()}.${decoded.extension}`;
          await writeFile(join(mediaDirectory, fileName), decoded.bytes);
          product.image = { src: `/api/demo/catalog/media/${fileName}`, alt: `${product.name}商品照片`, isPlaceholder: false };
        }
        if (changes.name?.trim()) {
          product.name = changes.name.trim();
          product.summary = product.summary || `茶名：${product.name}`;
        }
        if (changes.category) product.category = changes.category;
        if (changes.tasteTags !== undefined) product.tasteTags = [...changes.tasteTags];
        for (const key of ["fermentation", "roast", "brewing"] as const) {
          if (changes[key] !== undefined) {
            const value = changes[key].trim();
            if (value) product[key] = value; else delete product[key];
          }
        }
        if (changes.aroma !== undefined) { if (changes.aroma.trim()) product.aroma = changes.aroma.trim(); else delete product.aroma; }
        if (changes.taste !== undefined) { if (changes.taste.trim()) product.taste = changes.taste.trim(); else delete product.taste; }
        if (changes.teaRegion !== undefined) { if (changes.teaRegion.trim()) product.teaRegion = changes.teaRegion.trim(); else delete product.teaRegion; }
        if (changes.summary !== undefined && changes.summary.trim()) product.summary = changes.summary.trim();
        const variant = product.variants[0];
        if (variant) {
          if (changes.specification?.trim()) variant.specification = changes.specification.trim();
          if (changes.price) variant.price = { ...changes.price };
          if (changes.inventoryStatus) variant.inventoryStatus = changes.inventoryStatus;
        }
        await write(catalog);
        return clone(product);
      });
    },
    async publish(draft: ProductDraft, publication: Product["publication"] = "published"): Promise<Product> {
      return serialized(async () => {
        const catalog = await read();
        const id = `demo-published-${randomUUID()}`;
        const firstPhoto = draft.photos?.find((photo) => photo.dataUrl);
        let image: Product["image"] = { src: null, alt: "商品照片準備中", isPlaceholder: true };
        if (firstPhoto?.dataUrl) {
          const decoded = decodePhoto(firstPhoto.dataUrl);
          if (!decoded || decoded.bytes.length > 5 * 1024 * 1024) throw new Error("商品圖片格式或大小無效。限 PNG、JPEG、WebP 且不超過 5 MB。");
          await mkdir(mediaDirectory, { recursive: true });
          const fileName = `${id}.${decoded.extension}`;
          await writeFile(join(mediaDirectory, fileName), decoded.bytes);
          image = { src: `/api/demo/catalog/media/${fileName}`, alt: `${draft.name}商品照片`, isPlaceholder: false };
        }
        const product: Product = {
          id,
          slug: slugFor(draft.name, id),
          name: draft.name.trim(),
          category: draft.category,
          tasteTags: [...draft.tasteTags],
          summary: draft.summary?.trim() || `茶名：${draft.name.trim()}｜規格：${draft.specification.trim()}｜價格：TWD ${draft.price.amount}`,
          image,
          variants: [{ id: `${id}-variant`, specification: draft.specification.trim(), price: { ...draft.price }, inventoryStatus: draft.inventoryStatus, maxQuantity: 5 }],
          publication,
          ...(draft.origin?.trim() ? { teaRegion: draft.origin.trim() } : {}),
          ...(draft.aroma?.trim() ? { aroma: draft.aroma.trim() } : {}),
          ...(draft.taste?.trim() ? { taste: draft.taste.trim() } : {}),
          ...(draft.fermentation?.trim() ? { fermentation: draft.fermentation.trim() } : {}),
          ...(draft.roast?.trim() ? { roast: draft.roast.trim() } : {}),
          ...(draft.brewing?.trim() ? { brewing: draft.brewing.trim() } : {}),
        };
        catalog.products.push(product);
        await write(catalog);
        return clone(product);
      });
    },
    async readMedia(fileName: string): Promise<Buffer> {
      const safeName = basename(fileName);
      if (safeName !== fileName || safeName.includes("..")) throw new Error("Invalid media path");
      return readFile(resolve(mediaDirectory, safeName));
    },
  };
};

type DemoCatalogStore = ReturnType<typeof createDemoCatalogStore>;
const stores = new Map<string, DemoCatalogStore>();

export const getDemoCatalogStore = (): DemoCatalogStore => {
  const directory = resolve(process.env.DEMO_DATA_DIR || ".demo-data/local");
  const key = directory.toLowerCase();
  const existing = stores.get(key);
  if (existing) return existing;
  const store = createDemoCatalogStore({ filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "catalog-media") });
  stores.set(key, store);
  return store;
};

/** Synchronous read for the existing synchronous order boundary; still local-only and file-backed. */
export const readDemoCatalogProductsSync = (directory = resolve(process.env.DEMO_DATA_DIR || ".demo-data/local"), fallbackProducts = mockCatalogFixture): Product[] => {
  const filePath = join(directory, "catalog.json");
  mkdirSync(directory, { recursive: true });
  if (!existsSync(filePath)) writeFileSync(filePath, JSON.stringify({ version: 1, products: clone(fallbackProducts) }, null, 2), "utf8");
  const catalog = JSON.parse(readFileSync(filePath, "utf8")) as CatalogFile;
  return clone(catalog.products);
};
