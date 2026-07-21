import type { Metadata } from "next";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { CatalogResults } from "@/components/storefront/CatalogResults";
import { CatalogToolbar } from "@/components/storefront/CatalogToolbar";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { siteConfig } from "@/config/site";
import { DEFAULT_PRODUCT_SORT } from "@/lib/sort";
import { getPublicCategories } from "@/services/storefront/categories";
import { getPublicProducts } from "@/services/storefront/products";
import { getActivePromotions } from "@/services/storefront/promotions";

export const metadata: Metadata = {
  title: `${siteConfig.productsPage.title} | ${siteConfig.name}`,
  description: siteConfig.productsPage.description,
};

export default async function ProductsPage() {
  const { title, description, emptyState } = siteConfig.productsPage;
  const [products, categories, promotions] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
    getActivePromotions(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Productos" }]} />

      <div className="mt-6 flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-md text-muted-foreground">{description}</p>
      </div>

      {/*
        CatalogResults lee "?q="/"?sort=" con useSearchParams, por eso
        necesita un límite de Suspense. El fallback muestra el catálogo
        completo sin filtrar ni ordenar — es exactamente lo que se ve un
        instante antes de que hidrate, sin saltos visuales para el caso
        más común (sin query todavía). onSortChange es un no-op acá: el
        fallback no es interactivo, solo se ve una fracción de segundo.
      */}
      <Suspense
        fallback={
          <>
            <div className="mt-8">
              <CatalogToolbar productCount={products.length} sort={DEFAULT_PRODUCT_SORT} />
            </div>
            <div className="mt-8">
              {products.length > 0 ? (
                <ProductGrid
                  products={products}
                  categories={categories}
                  promotions={promotions}
                  dense
                />
              ) : (
                <EmptyState title={emptyState.title} description={emptyState.description} />
              )}
            </div>
          </>
        }
      >
        <CatalogResults products={products} categories={categories} promotions={promotions} />
      </Suspense>

      {/* Contenedor reservado para la paginación futura del catálogo. */}
      <div className="mt-12" />
    </main>
  );
}
