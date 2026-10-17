import type { Metadata } from "next";
import { AdminOrdersPage } from "@/features/demo/components/admin-orders-page";

export const metadata: Metadata = {
  title: "茶行訂單管理",
  applicationName: "陳老師茶行訂單管理",
  manifest: "/manifest-orders.webmanifest",
  icons: { icon: [{ url: "/icons/tea-orders-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/tea-orders-512.png", sizes: "512x512", type: "image/png" }] },
};

export default function Page() { return <AdminOrdersPage />; }
