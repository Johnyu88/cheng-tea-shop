import { ProductDetailPage } from "@/features/product/components/product-detail-page";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: ProductPageProps) {
  const { slug } = await params;

  return <ProductDetailPage slug={slug} />;
}
