import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = { title: "Passkey 鎖頭沙盒", robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
