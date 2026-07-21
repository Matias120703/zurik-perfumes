import type { Product } from "@/config/products";

export const PRODUCT_SORT_OPTIONS = [
  { value: "recientes", label: "Más recientes" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nombre-asc", label: "Nombre A-Z" },
  { value: "nombre-desc", label: "Nombre Z-A" },
] as const;

export type ProductSortValue = (typeof PRODUCT_SORT_OPTIONS)[number]["value"];

export const DEFAULT_PRODUCT_SORT: ProductSortValue = "recientes";

export function isProductSortValue(value: string): value is ProductSortValue {
  return PRODUCT_SORT_OPTIONS.some((option) => option.value === value);
}

/**
 * Devuelve una copia ordenada: nunca muta el array recibido (ni, por
 * lo tanto, el `products` de config/products.ts ni el resultado de
 * searchProducts). "recientes" es un no-op a propósito — es el orden
 * por default que ya existía antes de este sprint, y hoy `Product` no
 * tiene ningún campo de fecha real para ordenar por "más nuevo".
 */
export function sortProducts(products: Product[], sort: ProductSortValue): Product[] {
  switch (sort) {
    case "precio-asc":
      return [...products].sort((a, b) => a.price - b.price);
    case "precio-desc":
      return [...products].sort((a, b) => b.price - a.price);
    case "nombre-asc":
      return [...products].sort((a, b) => a.name.localeCompare(b.name, "es"));
    case "nombre-desc":
      return [...products].sort((a, b) => b.name.localeCompare(a.name, "es"));
    case "recientes":
    default:
      return products;
  }
}
