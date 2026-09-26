import { CheckoutPage } from "@/features/checkout/components/checkout-page";
import { DemoCheckoutPage } from "@/features/demo/components/demo-checkout-page";

export default function Page() {
  return process.env.NEXT_PUBLIC_DEMO_COMMERCE === "enabled" ? <DemoCheckoutPage /> : <CheckoutPage />;
}
