import { HomePage } from "@/features/home/components/home-page";
import { PublicTeaStorefront } from "@/features/home/components/public-tea-storefront";

export const dynamic = "force-dynamic";

export default function Page() {
  if (process.env.PUBLIC_STOREFRONT_SERVER === "enabled") return <PublicTeaStorefront />;
  return <HomePage />;
}
