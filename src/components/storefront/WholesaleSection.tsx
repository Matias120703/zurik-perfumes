"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, MessageCircle, Store, TrendingUp, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWholesaleHref, type HomeContent } from "@/lib/home-content";
import { sectionContainerVariants as container, sectionItemVariants as item } from "@/lib/motion";
import { getWhatsAppUrl } from "@/lib/utils";
import type { BusinessSettings } from "@/services/storefront/business";

/**
 * Bloque "Vendé perfumes con ZURIK": el llamado a la acción al grupo
 * mayorista. Es el único bloque de la Home que no vende un producto sino
 * una relación comercial, así que se separa visualmente del resto con
 * fondo propio y marco dorado.
 *
 * El destino del botón lo decide `getWholesaleHref` (`lib/home-content.ts`),
 * no este componente: con link de grupo cargado va al grupo; sin link, al
 * chat directo del negocio con el mensaje ya escrito. Nunca queda un
 * botón sin destino, aunque el admin todavía no haya pegado el link.
 */
export function WholesaleSection({
  content,
  settings,
}: {
  content: HomeContent;
  settings: BusinessSettings;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (!content.wholesaleEnabled) return null;

  const primaryHref = getWholesaleHref({
    groupUrl: content.wholesaleGroupUrl,
    whatsappNumber: settings.whatsappNumber,
    message: content.wholesaleWhatsappMessage,
  });

  /**
   * El botón secundario ("Hablar con un asesor") sólo aparece cuando el
   * principal ya apunta al grupo. Sin link de grupo cargado, el principal
   * ES el chat directo -- mostrar dos botones al mismo WhatsApp sería
   * ruido, no una segunda opción.
   */
  const hasGroupLink = Boolean(content.wholesaleGroupUrl?.trim());
  const advisorHref = getWhatsAppUrl(
    settings.whatsappNumber,
    content.wholesaleWhatsappMessage ?? settings.whatsappDefaultMessage
  );

  const benefits = content.wholesaleBenefits;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
      <motion.div
        initial={shouldReduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={container}
        className="relative overflow-hidden rounded-3xl border border-[var(--gold)]/30 bg-[color-mix(in_oklab,var(--gold)_7%,var(--card))] px-6 py-12 sm:px-10 lg:px-14 lg:py-16"
      >
        {/* Ambiente: dos halos dorados y una textura de puntos muy sutil. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-[var(--gold)]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full bg-[var(--gold)]/10 blur-3xl"
        />

        <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col items-start gap-5">
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-background/50 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-[var(--gold)] uppercase"
            >
              <Store className="size-3.5" aria-hidden="true" />
              {content.wholesaleEyebrow ?? "Mayoristas"}
            </motion.span>

            <motion.h2
              variants={item}
              className="font-display text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
            >
              {content.wholesaleTitle ?? "Vendé perfumes con nosotros"}
            </motion.h2>

            {content.wholesaleSubtitle ? (
              <motion.p variants={item} className="max-w-xl text-base text-muted-foreground">
                {content.wholesaleSubtitle}
              </motion.p>
            ) : null}

            {benefits.length > 0 ? (
              <motion.ul variants={item} className="grid gap-2.5 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm text-foreground/90">
                    <BadgeCheck
                      className="mt-0.5 size-4 shrink-0 text-[var(--gold)]"
                      aria-hidden="true"
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </motion.ul>
            ) : null}

            <motion.div variants={item} className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                nativeButton={false}
                className="bg-[var(--gold)] font-semibold text-[var(--gold-foreground)] shadow-lg shadow-[var(--gold)]/20 hover:opacity-90"
                render={<a href={primaryHref} target="_blank" rel="noopener noreferrer" />}
              >
                {content.wholesaleCtaLabel ?? "Sumarme al grupo mayorista"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>

              {hasGroupLink ? (
                <Button
                  variant="outline"
                  size="lg"
                  nativeButton={false}
                  className="border-[var(--gold)]/40 text-foreground hover:bg-[var(--gold)]/10"
                  render={<a href={advisorHref} target="_blank" rel="noopener noreferrer" />}
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Hablar con un asesor
                </Button>
              ) : null}
            </motion.div>
          </div>

          {/*
            Columna derecha: tres "razones" en tarjetas apiladas. No son
            métricas inventadas (nada de "+500 revendedores"), sino la
            propuesta de valor en formato escaneable -- un dato numérico
            falso acá dañaría la credibilidad de toda la sección.
          */}
          <motion.ul variants={item} className="flex flex-col gap-3">
            <WholesalePoint
              icon={TrendingUp}
              title="Precios por cantidad"
              description="Cuanto más comprás, mejor es tu margen de reventa."
            />
            <WholesalePoint
              icon={Users}
              title="Grupo de mayoristas"
              description="Novedades, stock y precios especiales antes que nadie."
            />
            <WholesalePoint
              icon={Store}
              title="Te ayudamos a arrancar"
              description="Catálogo, fotos y precios sugeridos listos para publicar."
            />
          </motion.ul>
        </div>
      </motion.div>
    </section>
  );
}

function WholesalePoint({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Store;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-4 rounded-2xl border border-border bg-background/40 p-4 backdrop-blur-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)]/12 text-[var(--gold)]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}
