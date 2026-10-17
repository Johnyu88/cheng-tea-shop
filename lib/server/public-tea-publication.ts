import { readFile, writeFile, rename, mkdir, copyFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { confirmedTeaFixture } from "@/lib/domain/mock/confirmed-tea-fixture";
import type { Product } from "@/lib/domain/types";
import { logger } from "@/lib/server/logger";

type Snapshot = {
  version: 1;
  publication: Record<string, "draft" | "published">;
  /** Public-only product metadata; merchant sessions and private data are never exported. */
  products?: Product[];
};

const safeImageName = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,180}\.(?:png|jpg|jpeg|webp)$/i;

export async function readPublicTeaCatalog(): Promise<Product[]> {
  const filePath = process.env.PUBLIC_CATALOG_VISIBILITY_PATH;
  if (!filePath) return confirmedTeaFixture.filter(product => product.publication === "published");
  try {
    const snapshot = JSON.parse(await readFile(resolve(filePath), "utf8")) as Snapshot;
    if (snapshot?.version !== 1 || !snapshot.publication || typeof snapshot.publication !== "object") throw new Error("Invalid public catalog");
    const products = Array.isArray(snapshot.products) ? snapshot.products : confirmedTeaFixture;
    return products.filter(product => snapshot.publication[product.id] === "published");
  } catch (error) {
    logger.error({ scope: "public-catalog", err: error }, "Public catalog unavailable");
    return [];
  }
}

/** Publishes only storefront-safe catalog data and images into a distinct shared directory. */
export async function writePublicTeaPublication(products: Product[]): Promise<void> {
  const filePath = process.env.PUBLIC_CATALOG_VISIBILITY_PATH;
  if (!filePath) throw new Error("Public catalog synchronization is not configured");
  const destination = resolve(filePath);
  const directory = dirname(destination);
  await mkdir(directory, { recursive: true });
  const publication: Snapshot["publication"] = {};
  const publicProducts: Product[] = [];
  for (const source of products) {
    if (!source.id || typeof source.id !== "string") continue;
    publication[source.id] = source.publication === "published" ? "published" : "draft";
    // Never export unpublished product metadata.
    if (source.publication !== "published") continue;
    // Explicit public allowlist. Never export inventory counts, private metadata, or merchant-only extensions.
    const product: Product = {
      id: source.id,
      slug: source.slug,
      name: source.name,
      category: source.category,
      tasteTags: [...source.tasteTags],
      summary: source.summary,
      image: { ...source.image },
      variants: source.variants.map(({ id, specification, price, inventoryStatus, maxQuantity }) => ({
        id, specification, price: { ...price }, inventoryStatus, maxQuantity,
      })),
      publication: "published",
      ...(source.teaRegion ? { teaRegion: source.teaRegion } : {}),
      ...(source.aroma ? { aroma: source.aroma } : {}),
      ...(source.taste ? { taste: source.taste } : {}),
      ...(source.fermentation ? { fermentation: source.fermentation } : {}),
      ...(source.roast ? { roast: source.roast } : {}),
      ...(source.brewing ? { brewing: source.brewing } : {}),
    };
    const imagePath = product.image.src;
    if (imagePath?.startsWith("/api/demo/catalog/media/")) {
      const filename = imagePath.slice("/api/demo/catalog/media/".length);
      if (!safeImageName.test(filename) || basename(filename) !== filename) throw new Error("Invalid public photo filename");
      const privateDir = resolve(process.env.DEMO_DATA_DIR || ".demo-data/local");
      await mkdir(join(directory, "media"), { recursive: true });
      await copyFile(join(privateDir, "catalog-media", filename), join(directory, "media", filename));
      product.image.src = "/api/public/media/" + filename;
    }
    publicProducts.push(product);
  }
  const temporary = destination + "." + process.pid + ".tmp";
  await writeFile(temporary, JSON.stringify({ version: 1, publication, products: publicProducts } satisfies Snapshot), "utf8");
  await rename(temporary, destination);
}
