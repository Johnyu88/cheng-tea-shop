import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { confirmedTeaFixture } from "@/lib/domain/mock/confirmed-tea-fixture";
import type { Product } from "@/lib/domain/types";

type Snapshot = { version: 1; publication: Record<string, "draft" | "published"> };
const candidateIds = new Set(confirmedTeaFixture.map(product => product.id));

export async function readPublicTeaCatalog(): Promise<Product[]> {
  const filePath = process.env.PUBLIC_CATALOG_VISIBILITY_PATH;
  if (!filePath) return confirmedTeaFixture.filter(product => product.publication === "published");
  try {
    const snapshot = JSON.parse(await readFile(resolve(filePath), "utf8")) as Snapshot;
    if (snapshot?.version !== 1 || !snapshot.publication || typeof snapshot.publication !== "object") throw new Error("Invalid public tea publication snapshot");
    return confirmedTeaFixture.filter(product => snapshot.publication[product.id] === "published");
  } catch (error) {
    // When shared publication data is unavailable, never publish hidden goods by assumption.
    console.error("Public catalog publication snapshot unavailable:", error instanceof Error ? error.message : "read failed");
    return [];
  }
}

/** Merchant-only: publish just the visibility of the eight approved teas. Never expose merchant data. */
export async function writePublicTeaPublication(products: Product[]): Promise<void> {
  const filePath = process.env.PUBLIC_CATALOG_VISIBILITY_PATH;
  if (!filePath) return;
  const publication: Snapshot["publication"] = {};
  for (const product of products) {
    if (candidateIds.has(product.id)) publication[product.id] = product.publication === "published" ? "published" : "draft";
  }
  // Explicitly mark missing or new fixture products unavailable.
  for (const id of candidateIds) publication[id] ??= "draft";
  const destination = resolve(filePath);
  await mkdir(dirname(destination), { recursive: true });
  const temporary = destination + "." + process.pid + ".tmp";
  await writeFile(temporary, JSON.stringify({ version: 1, publication } satisfies Snapshot), "utf8");
  await rename(temporary, destination);
}
