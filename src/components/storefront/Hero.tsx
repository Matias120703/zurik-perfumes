"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, MessageCircle, Sparkles, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductShowcase } from "@/components/storefront/ProductShowcase";
import { getGuaranteeIcon } from "@/components/storefront/guarantee-icons";
import type { Product } from "@/config/products";
import { siteConfig } from "@/config/site";
import type { HomeContent } from "@/lib/home-content";
import type { BusinessSettings } from "@/services/storefront/business";
import { getWhatsAppUrl } from "@/lib/utils";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

/** Cuántas garantías se repiten como "chips" de confianza bajo los CTAs. */
const MAX_TRUST_CHIPS = 3;

export function Hero({
  settings,
  showcaseProducts,
  content,
  hasOffers,
}: {
  settings: BusinessSettings;
  /** Productos del Showcase del panel derecho, resueltos por la Home. */
  showcaseProducts: Product[];
  /** Textos editables desde /admin/contenido. */
  content: HomeContent;
  /** Si hoy hay al menos un producto con descuento -- decide si se
   * muestran el badge de ofertas y el CTA "Ver ofertas". Se calcula en la
   * Home con la misma función que alimenta la sección de Ofertas, para
   * que el hero no pueda prometer ofertas que después no existen. */
  hasOffers: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const whatsappHref = getWhatsAppUrl(settings.whatsappNumber, settings.whatsappDefaultMessage);
  const trustChips = content.guarantees.slice(0, MAX_TRUST_CHIPS);

  return (
    <section className="relative overflow-hidden">
      {/*
        Ambiente del hero: dos halos dorados difusos sobre el negro y una
        línea dorada al pie. Es lo que convierte un fondo plano en una
        vidriera -- y hace que las fotos de los frascos, que vienen sobre
        fondos claros, se recorten con fuerza.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-24 size-[34rem] rounded-full bg-[var(--gold)]/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-52 -left-32 size-[30rem] rounded-full bg-[var(--gold)]/8 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="rule-gold pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-40"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pt-12 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-16 lg:pb-24">
        <motion.div
          initial={shouldReduceMotion ? "show" : "hidden"}
          animate="show"
          variants={container}
          className="flex flex-col items-start gap-6"
        >
          {content.heroBadge && hasOffers ? (
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--gold)]"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--gold)] opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-[var(--gold)]" />
              </span>
              {content.heroBadge}
            </motion.span>
          ) : null}

          {content.heroEyebrow ? (
            <motion.span
              variants={item}
              className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase"
            >
              <span className="rule-gold h-px w-10" aria-hidden="true" />
              {content.heroEyebrow}
            </motion.span>
          ) : null}

          <motion.h1
            variants={item}
            className="font-display text-[2.6rem] leading-[1.03] font-semibold tracking-tight text-foreground sm:text-6xl lg:text-[4.2rem]"
          >
            {content.heroTitle ?? siteConfig.hero.title}
          </motion.h1>

          <motion.p variants={item} className="max-w-lg text-base text-muted-foreground sm:text-lg">
            {content.heroSubtitle ?? siteConfig.hero.subtitle}
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              size="lg"
              nativeButton={false}
              className="bg-[var(--gold)] font-semibold text-[var(--gold-foreground)] shadow-lg shadow-[var(--gold)]/20 transition-transform hover:scale-[1.02] hover:opacity-95"
              render={<Link href="/productos" />}
            >
              Ver perfumes
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>

            {hasOffers ? (
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                className="border-[var(--gold)]/40 text-foreground transition-colors hover:bg-[var(--gold)]/10"
                render={<Link href="/ofertas" />}
              >
                <Tag className="size-4" aria-hidden="true" />
                Ver ofertas
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="lg"
              nativeButton={false}
              className="text-muted-foreground hover:text-foreground"
              render={<a href={whatsappHref} target="_blank" rel="noopener noreferrer" />}
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {siteConfig.hero.secondaryCta.label}
            </Button>
          </motion.div>

          {/*
            Chips de confianza: repiten las primeras garantías cargadas en
            /admin/contenido, para que el argumento de compra esté visible
            sin scrollear. Comparten la fuente de datos con
            `GuaranteesSection` -- no hay una segunda lista que mantener.
          */}
          {trustChips.length > 0 ? (
            <motion.ul
              variants={item}
              className="flex flex-wrap items-center gap-x-5 gap-y-2.5 pt-3"
            >
              {trustChips.map((chip) => {
                const Icon = getGuaranteeIcon(chip.icon);
                return (
                  <li
                    key={chip.title}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm"
                  >
                    <Icon className="size-4 text-[var(--gold)]" aria-hidden="true" />
                    {chip.title}
                  </li>
                );
              })}
            </motion.ul>
          ) : null}
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative"
        >
          {/* Resplandor detrás del showcase: separa el frasco del fondo. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-6 rounded-full bg-[var(--gold)]/10 blur-3xl"
          />
          <div className="relative">
            <ProductShowcase products={showcaseProducts} />
          </div>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-3 -left-3 hidden size-16 rounded-tl-3xl border-t border-l border-[var(--gold)]/40 lg:block"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 -bottom-3 hidden size-16 rounded-br-3xl border-r border-b border-[var(--gold)]/40 lg:block"
          />

          <span className="pointer-events-none absolute -top-2 right-6 hidden items-center gap-1.5 rounded-full border border-[var(--gold)]/30 bg-background/90 px-3 py-1 text-[10px] font-semibold tracking-wide text-[var(--gold)] uppercase backdrop-blur-sm lg:inline-flex">
            <Sparkles className="size-3" aria-hidden="true" />
            Stock disponible
          </span>
        </motion.div>
      </div>
    </section>
  );
}
