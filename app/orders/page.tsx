import { Suspense } from "react";
import { OrderLookupPage } from "@/features/demo/components/order-lookup-page";

export default function Page() {
  return <Suspense fallback={<main><p>正在準備查單</p></main>}><OrderLookupPage /></Suspense>;
}
