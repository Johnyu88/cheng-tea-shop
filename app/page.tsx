import { HomePage } from "@/features/home/components/home-page";
import { PublicTeaStorefront } from "@/features/home/components/public-tea-storefront";
import { readPublicTeaCatalog } from "@/lib/server/public-tea-publication";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (process.env.PUBLIC_STOREFRONT_SERVER === "enabled") return <PublicTeaStorefront teas={await readPublicTeaCatalog()} />;
  return <HomePage />;
}
