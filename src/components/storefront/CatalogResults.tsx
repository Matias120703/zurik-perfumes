"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/shared/EmptyState";
import { CatalogToolbar } from "@/components/storefront/CatalogToolbar";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";
import { siteConfig } from "@/config/site";
import { searchProducts } from "@/lib/search";
import {
  DEFAULT_PRODUCT_SORT,
  isProductSortValue,
  sortProducts,
  type ProductSortValue,
} from "@/lib/sort";
import type { PublicPromotion } from "@/services/storefront/promotions";

/**
 * Único punto que conoce la búsqueda Y el orden del catálogo: lee "?q="
 * y "?sort=" de la URL, filtra con searchProducts y DESPUÉS ordena el
 * resultado con sortProducts (nunca al revés) — ProductGrid no se
 * entera de que existen ninguno de los dos, sigue recibiendo nada más
 * que un array de Product ya resuelto.
 *
 * `products` ya viene resuelto por quien la use (todo el catálogo en
 * /productos, o solo los de una categoría en /categorias/[slug], Sprint
 * 4.4) — este componente no sabe ni le importa si hay un filtro de
 * categoría por delante; por eso usa `usePathname()` en vez de tener
 * "/productos" hardcodeado al escribir "?sort=" en la URL, y así sigue
 * funcionando igual sin importar desde qué ruta se lo use. `categories`
 * (Sprint 5.3) se recibe por la misma razón: viene ya resuelto desde
 * Supabase, este componente solo se lo pasa a `searchProducts` para
 * poder buscar también por nombre de categoría. `promotions` (Sprint 6.1)
 * solo se reenvía a `ProductGrid` -- ni la búsqueda ni el orden necesitan
 * saber nada de promociones.
 */
export function CatalogResults({
  products,
  categories,
  promotions,
}: {
  products: Product[];
  categories: Category[];
  promotions: PublicPromotion[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const isSearching = query.trim().length > 0;

  const rawSort = searchParams.get("sort");
  const sort: ProductSortValue =
    rawSort && isProductSortValue(rawSort) ? rawSort : DEFAULT_PRODUCT_SORT;

  const visibleProducts = useMemo(() => {
    const matches = searchProducts(products, query, categories);
    return sortProducts(matches, sort);
  }, [products, query, sort, categories]);

  function handleSortChange(nextSort: ProductSortValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === DEFAULT_PRODUCT_SORT) {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  const { emptyState, searchEmptyState } = siteConfig.productsPage;

  return (
    <>
      <div className="mt-8">
        <CatalogToolbar
          productCount={visibleProducts.length}
          sort={sort}
          onSortChange={handleSortChange}
        />
      </div>

      <div className="mt-8">
        {visibleProducts.length > 0 ? (
          <ProductGrid
            products={visibleProducts}
            categories={categories}
            promotions={promotions}
            dense
          />
        ) : (
          <EmptyState
            title={isSearching ? searchEmptyState.title : emptyState.title}
            description={isSearching ? searchEmptyState.description : emptyState.description}
          />
        )}
      </div>
    </>
  );
}
