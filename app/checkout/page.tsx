import { CheckoutPage } from "@/features/checkout/components/checkout-page";
import { DemoCheckoutPage } from "@/features/demo/components/demo-checkout-page";
import { CheckoutExitNav } from "@/features/checkout/components/checkout-exit-nav";
import { MerchantManualCheckoutPage } from "@/features/checkout/components/merchant-manual-checkout-page";
import { StorefrontShell } from "@/features/storefront/components/storefront-shell";

export default function Page() {
  if (process.env.PUBLIC_STOREFRONT_SERVER === "enabled" || process.env.NEXT_PUBLIC_MERCHANT_MANUAL_ORDER === "enabled") return <StorefrontShell><MerchantManualCheckoutPage /></StorefrontShell>;
  return <StorefrontShell>{process.env.NEXT_PUBLIC_DEMO_COMMERCE === "enabled" ? <DemoCheckoutPage /> : <><CheckoutExitNav /><CheckoutPage /></>}</StorefrontShell>;
}
