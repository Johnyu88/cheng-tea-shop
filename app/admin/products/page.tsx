import type { Metadata } from "next";
import { ProductManagementPage } from "@/features/publishing/components/product-management-page";

export const metadata: Metadata = {
  title: "茶行商品管理",
  applicationName: "陳老師茶行商品管理",
  manifest: "/manifest-products.webmanifest",
  icons: { icon: [{ url: "/icons/tea-products-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/tea-products-512.png", sizes: "512x512", type: "image/png" }] },
};

export default function Page() {
  return <ProductManagementPage />;
}
