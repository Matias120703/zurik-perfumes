import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";

/** Minúsculas, sin espacios al borde y sin espacios dobles internos. */
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Filtra productos por nombre, descripción corta o nombre de categoría.
 * Todo en memoria, sobre los arrays que ya tiene la página — sin red
 * propia. `categories` se recibe por parámetro (ya no se importa de
 * config/categories.ts) desde el Sprint 5.3: quien llama a esta función
 * (`CatalogResults`) ahora recibe las categorías reales de Supabase, y
 * esta función sigue siendo pura, sin saber de dónde salió ese array. Si
 * la query tiene varias palabras, exige que TODAS aparezcan (en
 * cualquier campo, en cualquier orden), para que buscar "auriculares
 * bluetooth" siga encontrando el producto aunque las palabras coincidan
 * en dos campos distintos.
 */
export function searchProducts(products: Product[], query: string, categories: Category[]): Product[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return products;

  const terms = normalizedQuery.split(" ").filter(Boolean);

  return products.filter((product) => {
    const category = categories.find((c) => c.slug === product.category);
    const haystack = normalize(
      `${product.name} ${product.shortDescription} ${category?.name ?? ""}`
    );
    return terms.every((term) => haystack.includes(term));
  });
}
