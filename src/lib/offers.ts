import type { Product } from "@/config/products";
import { getProductDisplayPrice, type PricingPromotion } from "@/lib/promotions";

/**
 * Devuelve los productos que hoy tienen un descuento real, ordenados de
 * mayor a menor ahorro.
 *
 * Función pura, en su propio archivo, por el mismo criterio que ya
 * separa `lib/search.ts` de `lib/sort.ts`: "está en oferta" es una regla
 * de negocio, no una decisión de presentación, y la consumen dos lugares
 * distintos (la sección de la Home y la página /ofertas).
 *
 * Deliberadamente NO define su propio concepto de descuento: delega en
 * `getProductDisplayPrice`, el motor único de precios del proyecto
 * (Sprint 6.1). Así una "oferta" es siempre lo mismo -- promoción
 * vigente de Supabase o el `oldPrice`/`onSale` legacy -- y nunca puede
 * pasar que el catálogo muestre un precio tachado que esta sección
 * ignore, o al revés.
 */
export function getDiscountedProducts(
  products: Product[],
  promotions: PricingPromotion[]
): Product[] {
  return products
    .map((product) => ({
      product,
      display: getProductDisplayPrice(product, promotions),
    }))
    .filter(
      (entry) =>
        entry.display.badgeVariant === "discount" &&
        entry.display.compareAtPrice !== null &&
        entry.display.compareAtPrice > entry.display.price
    )
    .sort(
      (a, b) =>
        (b.display.compareAtPrice! - b.display.price) -
        (a.display.compareAtPrice! - a.display.price)
    )
    .map((entry) => entry.product);
}
