import type { Product } from "@/config/products";

/**
 * `getCategoryBySlug` (que buscaba en el array de config/categories.ts) se
 * eliminó en el Sprint 5.4 -- ya no tenía ningún call site desde la Fase
 * 11, superada por `getPublicCategoryBySlug` (services/storefront/
 * categories.ts). `getProductsByCategory` se mantiene tal cual: sigue
 * siendo una función pura, sin JSX ni hooks, sin ninguna dependencia a
 * config/ -- mismo criterio que searchProducts/sortProducts.
 */
export function getProductsByCategory(products: Product[], categorySlug: string): Product[] {
  return products.filter((product) => product.category === categorySlug);
}
