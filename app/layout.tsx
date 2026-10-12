import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CommerceProvider } from "@/features/commerce/components/commerce-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "陳老師茶行",
  applicationName: "陳老師茶行",
  description: "陳老師茶行｜台灣特色茶品、茶香與電話 LINE 訂購。",
  manifest: "/manifest-storefront.webmanifest",
  icons: { icon: [{ url: "/icons/tea-store-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/tea-store-512.png", sizes: "512x512", type: "image/png" }] },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        <CommerceProvider>{children}</CommerceProvider>
      </body>
    </html>
  );
}
