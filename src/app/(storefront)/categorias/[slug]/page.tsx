import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { CatalogResults } from "@/components/storefront/CatalogResults";
import { CatalogToolbar } from "@/components/storefront/CatalogToolbar";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { siteConfig } from "@/config/site";
import { getProductsByCategory } from "@/lib/categories";
import { DEFAULT_PRODUCT_SORT } from "@/lib/sort";
import { getPublicCategories, getPublicCategoryBySlug } from "@/services/storefront/categories";
import { getPublicProducts } from "@/services/storefront/products";
import { getActivePromotions } from "@/services/storefront/promotions";

type CategoryPageParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<CategoryPageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    return { title: `Categoría no encontrada | ${siteConfig.name}` };
  }

  return {
    title: `${category.name} | ${siteConfig.name}`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<CategoryPageParams>;
}) {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  // Paso 1 del pipeline (categoría) resuelto acá, antes de que
  // CatalogResults aplique búsqueda y orden (pasos 2 y 3) — mismo
  // componente que /productos, sin ningún catálogo nuevo.
  // getProductsByCategory (lib/categories.ts) no cambió: sigue siendo una
  // función pura que filtra el array que le pasan, ahora ya resuelto
  // desde Supabase (Sprint 5.3).
  const [allProducts, allCategories, promotions] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
    getActivePromotions(),
  ]);
  const categoryProducts = getProductsByCategory(allProducts, category.slug);
  const { emptyState } = siteConfig.productsPage;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Categorías", href: "/categorias" },
          { label: category.name },
        ]}
      />

      <div className="mt-6 flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {category.name}
        </h1>
        <p className="max-w-md text-muted-foreground">{category.description}</p>
      </div>

      <Suspense
        fallback={
          <>
            <div className="mt-8">
              <CatalogToolbar
                productCount={categoryProducts.length}
                sort={DEFAULT_PRODUCT_SORT}
              />
            </div>
            <div className="mt-8">
              {categoryProducts.length > 0 ? (
                <ProductGrid
                  products={categoryProducts}
                  categories={allCategories}
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
        <CatalogResults
          products={categoryProducts}
          categories={allCategories}
          promotions={promotions}
        />
      </Suspense>
    </main>
  );
}
