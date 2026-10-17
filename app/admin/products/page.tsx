import type { Metadata } from "next";
import { ProductManagementPage } from "@/features/publishing/components/product-management-page";

export const metadata: Metadata = {
  title: "茶行商品管理",
  applicationName: "陳老師茶行商品管理",
  manifest: "/manifest-products.webmanifest",
  icons: { icon: [{ url: "/icons/tea-products-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/tea-products-512.png", sizes: "512x512", type: "image/png" }] },
};

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const diagnostics = params.diagnostics === "1";
  return <>
    {diagnostics && <>
      <section id="tea-admin-diagnostics" data-phase="html-loaded" aria-label="商品頁診斷面板">
        <strong>診斷模式：HTML 已載入</strong>
        <ol id="tea-admin-diagnostics-events" />
        <noscript>HTML 已載入；JavaScript 未啟動。</noscript>
      </section>
      <script src="/diagnostics/admin-products.js" defer />
    </>}
    <ProductManagementPage />
  </>;
}
