"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame } from "lucide-react";

import { ProductCard } from "@/components/storefront/ProductCard";
import { SectionHeading } from "@/components/storefront/SectionHeading";
import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";
import { sectionContainerVariants as container } from "@/lib/motion";
import { getDiscountedProducts } from "@/lib/offers";
import type { PublicPromotion } from "@/services/storefront/promotions";

const MAX_PRODUCTS = 8;

/**
 * Sección de Ofertas: lo primero que ve el cliente después del hero,
 * porque es lo que más convierte en una tienda de perfumes.
 *
 * Qué producto entra acá NO se decide en este componente: lo resuelve
 * `getDiscountedProducts` (`lib/offers.ts`), que se apoya en el motor de
 * precios único del proyecto (`getProductDisplayPrice`) -- así una oferta
 * de esta sección es exactamente lo mismo que un precio tachado en el
 * catálogo, sin dos definiciones distintas de "está en oferta".
 *
 * Si ningún producto tiene descuento vigente, la sección no se renderiza
 * -- nunca queda un bloque "Ofertas" vacío, ni se inventa una oferta.
 */
export function OffersSection({
  products,
  categories,
  promotions,
  eyebrow,
  title,
  subtitle,
}: {
  products: Product[];
  categories: Category[];
  promotions: PublicPromotion[];
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
}) {
  const shouldReduceMotion = useReducedMotion();
  const offers = getDiscountedProducts(products, promotions).slice(0, MAX_PRODUCTS);

  if (offers.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-y border-[var(--gold)]/15 bg-[color-mix(in_oklab,var(--gold)_5%,var(--background))]">
      {/* Halo dorado difuso -- da profundidad sin competir con las fotos. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[46rem] -translate-x-1/2 rounded-full bg-[var(--gold)]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <SectionHeading
          eyebrow={eyebrow ?? "Ofertas"}
          title={title ?? "Ofertas de la semana"}
          subtitle={subtitle}
          action={{ label: "Ver todas las ofertas", href: "/ofertas" }}
        />

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-background/60 px-3 py-1.5 text-xs font-medium text-[var(--gold)]">
          <Flame className="size-3.5" aria-hidden="true" />
          {offers.length === 1
            ? "1 fragancia con precio especial"
            : `${offers.length} fragancias con precio especial`}
        </div>

        <motion.div
          initial={shouldReduceMotion ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={container}
          className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4"
        >
          {offers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categories={categories}
              promotions={promotions}
              dense
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
