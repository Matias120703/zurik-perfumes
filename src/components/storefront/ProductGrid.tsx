"use client";

import { motion, useReducedMotion } from "framer-motion";

import { ProductCard } from "@/components/storefront/ProductCard";
import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";
import { cn } from "@/lib/utils";
import { sectionContainerVariants } from "@/lib/motion";
import type { PublicPromotion } from "@/services/storefront/promotions";

/**
 * Grilla simple de productos, sin carrusel: pensada para páginas de
 * listado completo (catálogo, categoría, búsqueda, ofertas), a
 * diferencia de FeaturedProducts que arma su propio carrusel para la Home.
 * No conoce FeaturedProducts ni ningún otro componente: solo recibe
 * un array de Product (y, desde el Sprint 5.4, las categorías; desde el
 * Sprint 6.1, las promociones vigentes) ya resueltos desde Supabase y los
 * renderiza con ProductCard.
 *
 * `dense` (Sprint 6.4.1): sin ese prop, el grid se comporta EXACTAMENTE
 * igual que siempre (1 columna en mobile, 2 en tablet, 4 en desktop) --
 * es el caso de `RelatedProducts.tsx` en la página individual de
 * producto, explícitamente protegida ese sprint, así que no se le tocó
 * una sola clase. Solo `CatalogResults.tsx` (y los fallbacks de Suspense
 * de `/productos` y `/categorias/[slug]`, sus únicos dos consumidores)
 * pasan `dense` -- 2 columnas en mobile por defecto (el objetivo central
 * del sprint), 3 en tablet, 4 en desktop, con gaps más chicos para
 * aprovechar el espacio angosto de 2 columnas. Un solo componente, sin
 * duplicar nada -- la diferencia vive en un prop opcional, no en un
 * segundo archivo.
 */
export function ProductGrid({
  products,
  categories,
  promotions,
  dense,
}: {
  products: Product[];
  categories: Category[];
  promotions: PublicPromotion[];
  dense?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? "show" : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={sectionContainerVariants}
      className={cn(
        "grid",
        dense
          ? "grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4"
          : "grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          categories={categories}
          promotions={promotions}
          dense={dense}
        />
      ))}
    </motion.div>
  );
}
