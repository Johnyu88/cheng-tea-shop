import { CartPage } from "@/features/cart/components/cart-page";
import { StorefrontShell } from "@/features/storefront/components/storefront-shell";

export default function Page() {
  return <StorefrontShell><CartPage /></StorefrontShell>;
}
