import { CheckoutPage } from "@/features/checkout/components/checkout-page";
import { DemoCheckoutPage } from "@/features/demo/components/demo-checkout-page";
import { CheckoutExitNav } from "@/features/checkout/components/checkout-exit-nav";
import { MerchantManualCheckoutPage } from "@/features/checkout/components/merchant-manual-checkout-page";

export default function Page() {
  if (process.env.NEXT_PUBLIC_MERCHANT_MANUAL_ORDER === "enabled") return <MerchantManualCheckoutPage />;
  return process.env.NEXT_PUBLIC_DEMO_COMMERCE === "enabled" ? <DemoCheckoutPage /> : <><CheckoutExitNav /><CheckoutPage /> </>;
}
