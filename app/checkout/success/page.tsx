import { DemoCheckoutSuccessPage } from "@/features/demo/components/demo-checkout-success-page";

export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const params = await searchParams;
  return <DemoCheckoutSuccessPage orderId={params.order ?? ""} status="confirmed" />;
}
