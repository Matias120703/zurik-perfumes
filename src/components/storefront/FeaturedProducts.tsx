"use client";

import { motion, useReducedMotion } from "framer-motion";

import { ProductCard } from "@/components/storefront/ProductCard";
import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";
import { siteConfig } from "@/config/site";
import { sectionContainerVariants as container } from "@/lib/motion";
import type { PublicPromotion } from "@/services/storefront/promotions";

const MAX_PRODUCTS = 8;

/**
 * `products` se recibe por prop desde el Sprint 5.3 -- lo resuelve la
 * Home (Server Component) vía services/storefront/products.ts, ya no se
 * importa el array de config/products.ts directamente. El filtro
 * `.featured` y el límite de 8 no cambiaron. `categories` se suma en el
 * Sprint 5.4, con el mismo criterio: ya no se importa config/categories.ts,
 * se recibe resuelta desde Supabase y se reenvía a cada ProductCard.
 * `promotions` se suma en el Sprint 6.1, mismo criterio: precio/badge
 * promocional resueltos por ProductCard vía getProductDisplayPrice.
 */
export function FeaturedProducts({
  products,
  categories,
  promotions,
}: {
  products: Product[];
  categories: Category[];
  promotions: PublicPromotion[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const { eyebrow, title, subtitle } = siteConfig.featuredProductsSection;
  const featuredProducts = products.filter((p) => p.featured).slice(0, MAX_PRODUCTS);

  if (featuredProducts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="max-w-md text-muted-foreground">{subtitle}</p>
      </div>

      <motion.div
        initial={shouldReduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={container}
        className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden"
      >
        {featuredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categories={categories}
            promotions={promotions}
            className="w-[72%] shrink-0 snap-start md:w-auto md:shrink"
          />
        ))}
      </motion.div>
    </section>
  );
}
