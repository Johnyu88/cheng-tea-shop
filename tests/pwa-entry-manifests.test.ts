import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const entries = [
  { file: "manifest-storefront.webmanifest", id: "/tea-pwa/storefront", start: "/?pwa=storefront", scope: "/", icon: "tea-store" },
  { file: "manifest-products.webmanifest", id: "/tea-pwa/admin-products", start: "/admin/products?pwa=products", scope: "/admin/products", icon: "tea-products" },
  { file: "manifest-orders.webmanifest", id: "/tea-pwa/admin-orders", start: "/admin/orders?pwa=orders", scope: "/admin/orders", icon: "tea-orders" },
];

describe("independent tea PWA entries", () => {
  test("use unique identities, install routes, scopes and real PNG icons", () => {
    const manifests = entries.map(entry => JSON.parse(readFileSync(resolve("public", entry.file), "utf8")));
    expect(new Set(manifests.map(manifest => manifest.id)).size).toBe(3);
    for (const [index, entry] of entries.entries()) {
      const manifest = manifests[index];
      expect(manifest).toMatchObject({ id: entry.id, start_url: entry.start, scope: entry.scope, display: "standalone" });
      expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
        `/icons/${entry.icon}-192.png`, `/icons/${entry.icon}-512.png`,
      ]);
      for (const size of [192, 512]) expect(existsSync(resolve("public", "icons", `${entry.icon}-${size}.png`))).toBe(true);
    }
  });

  test("admin routes bind the correct manifest while sharing one app", () => {
    expect(readFileSync(resolve("app/layout.tsx"), "utf8")).toContain("/manifest-storefront.webmanifest");
    expect(readFileSync(resolve("app/admin/products/page.tsx"), "utf8")).toContain("/manifest-products.webmanifest");
    expect(readFileSync(resolve("app/admin/orders/page.tsx"), "utf8")).toContain("/manifest-orders.webmanifest");
  });
});
