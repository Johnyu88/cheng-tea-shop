import { it } from "vitest";
import { join } from "node:path";
import { createDemoCatalogStore } from "@/lib/server/demo-catalog-store";
import type { ProductDraft } from "@/lib/domain";

const run = process.env.PRODUCT_11_CHILD === "1";

(run ? it : it.skip)("writes one synthetic product from this separate Node process", async () => {
  const directory = process.env.PRODUCT_11_SHARED_DIR;
  const name = process.env.PRODUCT_11_PRODUCT_NAME;
  if (!directory || !name) throw new Error("missing child test environment");
  const draft: ProductDraft = {
    name,
    specification: "一兩",
    price: { currency: "TWD", amount: 888 },
    category: "black",
    inventoryStatus: "available",
    tasteTags: [],
  };
  await createDemoCatalogStore({ filePath: join(directory, "catalog.json"), mediaDirectory: join(directory, "media"), seedProducts: [] }).publish(draft, "draft");
});
