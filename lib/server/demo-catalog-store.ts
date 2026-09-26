import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import type { Product, ProductDraft } from "@/lib/domain";
import { confirmedTeaFixture } from "@/lib/domain/mock/confirmed-tea-fixture";
import { mockCatalogFixture } from "@/lib/domain/mock/catalog-fixture";

type CatalogFile = { version: 1; products: Product[] };
type StoreOptions = { filePath: string; mediaDirectory: string; seedProducts?: Product[] };

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
    async publish(draft: ProductDraft): Promise<Product> {
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
          publication: "published",
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
