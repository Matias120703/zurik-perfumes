import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ProductBuyBox } from "@/components/storefront/ProductBuyBox";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductRichDescription } from "@/components/storefront/ProductRichDescription";
import { RelatedProducts } from "@/components/storefront/RelatedProducts";
import { siteConfig } from "@/config/site";
import { getPublicBusinessSettings } from "@/services/storefront/business";
import { getPublicCategories } from "@/services/storefront/categories";
import { getPublicProductBySlug } from "@/services/storefront/products";
import { getActivePromotions } from "@/services/storefront/promotions";

type ProductPageParams = { slug: string };

/**
 * Sin generateStaticParams desde el Sprint 5.3: los productos ya viven en
 * Supabase y pueden crearse/editarse desde el panel en cualquier momento
 * (Fase 10), así que pre-generar una lista fija de slugs en build time ya
 * no tiene sentido -- cada visita resuelve el producto actual directo
 * contra la base. `getPublicProductBySlug` usa el cliente de servidor
 * (cookies()), lo que además obliga a Next a renderizar esta ruta
 * dinámicamente en cada request -- exactamente lo que hace falta para
 * que un producto nuevo aparezca sin rebuild.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<ProductPageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    return { title: `Producto no encontrado | ${siteConfig.name}` };
  }

  return {
    title: `${product.name} | ${siteConfig.name}`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<ProductPageParams>;
}) {
  const { slug } = await params;
  const [product, categories, settings, promotions] = await Promise.all([
    getPublicProductBySlug(slug),
    getPublicCategories(),
    getPublicBusinessSettings(),
    getActivePromotions(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Productos", href: "/productos" },
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery product={product} categories={categories} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <ProductBuyBox
            product={product}
            categories={categories}
            promotions={promotions}
            settings={settings}
          />
        </div>
      </div>

      <ProductRichDescription description={product.description} />

      <RelatedProducts product={product} categories={categories} promotions={promotions} />
    </main>
  );
}
