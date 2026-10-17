import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CommerceProvider } from "@/features/commerce/components/commerce-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "陳老師茶行",
  description: "陳老師茶行的官方網站技術基線。",
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
