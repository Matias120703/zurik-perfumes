"use client";

import { motion, useReducedMotion } from "framer-motion";

import { CategoryCard } from "@/components/storefront/CategoryCard";
import { SectionHeading } from "@/components/storefront/SectionHeading";
import type { Category } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { sectionContainerVariants as container } from "@/lib/motion";

/**
 * `categories` se recibe por prop desde el Sprint 5.3 -- lo resuelve la
 * Home (Server Component) vía services/storefront/categories.ts, ya no
 * se importa el array de config/categories.ts directamente.
 */
export function FeaturedCategories({ categories }: { categories: Category[] }) {
  const shouldReduceMotion = useReducedMotion();
  const { eyebrow, title, subtitle } = siteConfig.featuredCategoriesSection;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        action={{ label: "Ver todas las marcas", href: "/categorias" }}
      />

      <motion.div
        initial={shouldReduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={container}
        className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            className="w-[78%] shrink-0 snap-start md:w-auto md:shrink"
          />
        ))}
      </motion.div>
    </section>
  );
}
