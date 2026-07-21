"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductShowcase } from "@/components/storefront/ProductShowcase";
import type { Product } from "@/config/products";
import { siteConfig } from "@/config/site";
import type { BusinessSettings } from "@/services/storefront/business";
import { getWhatsAppUrl } from "@/lib/utils";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function Hero({
  settings,
  showcaseProducts,
}: {
  settings: BusinessSettings;
  /** Productos para el Showcase del panel derecho (Sprint 6.3), resueltos
   * por la Home vía `getPublicHeroProducts()` -- Hero no consulta
   * Supabase, solo reenvía el array a `ProductShowcase`. */
  showcaseProducts: Product[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const whatsappHref = getWhatsAppUrl(settings.whatsappNumber, settings.whatsappDefaultMessage);

  return (
    <section className="relative overflow-hidden">
      <motion.div
        initial={shouldReduceMotion ? "show" : "hidden"}
        animate="show"
        variants={container}
        className="mx-auto grid min-h-[90vh] max-w-7xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-24"
      >
        <div className="flex flex-col items-start gap-6">
          <motion.span
            variants={item}
            className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {siteConfig.hero.eyebrow}
          </motion.span>

          <motion.h1
            variants={item}
            className="text-4xl leading-[1.05] font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            {siteConfig.hero.title}
          </motion.h1>

          <motion.p variants={item} className="max-w-md text-lg text-muted-foreground">
            {siteConfig.hero.subtitle}
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center gap-4 pt-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={siteConfig.hero.primaryCta.href} />}
              >
                {siteConfig.hero.primaryCta.label}
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" />
                }
              >
                <MessageCircle className="size-4" />
                {siteConfig.hero.secondaryCta.label}
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/*
          Sprint 6.3: el marcador visual estático se reemplazó por un
          Showcase dinámico de productos reales (ver ProductShowcase.tsx).
          Mismo contenedor externo de siempre (motion.div variants={item}),
          para no tocar el layout/stagger de entrada ya aprobado del Hero.
        */}
        <motion.div variants={item}>
          <ProductShowcase products={showcaseProducts} />
        </motion.div>
      </motion.div>
    </section>
  );
}
