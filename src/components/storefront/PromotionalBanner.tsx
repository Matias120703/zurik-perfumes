"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sectionContainerVariants as container, sectionItemVariants as item } from "@/lib/motion";
import type { PublicPromotion } from "@/services/storefront/promotions";

/** Único estilo visual usado hoy: `promotions` (Supabase) no modela una
 * elección de fondo por campaña como sí lo hacía `config/promotion.ts`
 * (dark/light) -- es una decisión de diseño fija, no un dato de negocio,
 * así que no hace falta "no hardcodearla". */
const styles = {
  section: "bg-foreground text-background",
  subtitle: "text-background/70",
  badge: "border-background/25 bg-background/10 text-background",
  button: "bg-background text-foreground hover:bg-background/90",
  placeholderFrame: "border-background/15 bg-background/5",
  placeholderBlob: "bg-background/10",
  dotClassName: "text-background",
  iconClassName: "text-background/10",
  navButton: "text-background/80 hover:bg-background/10 hover:text-background",
};

/** Cuánto se muestra cada promoción antes de empezar a deslizar a la
 * siguiente -- "esperar aproximadamente 2 segundos" del sprint. */
const AUTO_ADVANCE_MS = 2500;

/**
 * Contenido de una sola promoción (texto + botón + imagen/placeholder) --
 * compartido entre el caso de una sola promoción (con el mismo stagger de
 * entrada de siempre, `useItemVariants=true`) y cada slide del carrusel
 * (`useItemVariants=false`: el slide ya trae su propia transición
 * horizontal, volver a animar cada bloque por separado se vería
 * redundante). Es la única función que sabe dibujar una promoción -- ni
 * el caso simple ni el carrusel duplican este JSX.
 */
function PromotionContent({
  promotion,
  useItemVariants,
}: {
  promotion: PublicPromotion;
  useItemVariants: boolean;
}) {
  const subtitle =
    promotion.description ??
    `Aprovechá esta oferta en ${promotion.targetLabel}, por tiempo limitado.`;
  const itemVariants = useItemVariants ? item : undefined;

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
      <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
        <motion.div variants={itemVariants}>
          <Badge variant="outline" className={cn("tracking-wide", styles.badge)}>
            {promotion.discountLabel}
          </Badge>
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl"
        >
          {promotion.title}
        </motion.h2>

        <motion.p variants={itemVariants} className={cn("max-w-md text-lg", styles.subtitle)}>
          {subtitle}
        </motion.p>

        <motion.div variants={itemVariants}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              nativeButton={false}
              className={styles.button}
              render={<Link href={promotion.targetHref} />}
            >
              Ver oferta
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/*
        Cuando la promoción es de un producto con foto real, se muestra
        esa foto (misma señal `isRealImageUrl` que ProductCard/
        ProductGallery, reutilizando product_images -- bug 2, Sprint
        6.0.1). Sin imagen (promoción de categoría, o producto todavía
        sin foto real) se mantiene el mismo placeholder de diseño de
        siempre.
      */}
      <motion.div variants={itemVariants}>
        <div
          className={cn(
            "relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border",
            styles.placeholderFrame
          )}
        >
          {promotion.imageUrl ? (
            <Image
              src={promotion.imageUrl}
              alt={promotion.targetLabel}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <>
              <div
                className={cn(
                  "absolute -top-10 -left-10 size-64 rounded-full blur-3xl",
                  styles.placeholderBlob
                )}
              />
              <div
                className={cn(
                  "absolute -right-10 -bottom-16 size-72 rounded-full blur-3xl",
                  styles.placeholderBlob
                )}
              />
              <div
                className={cn("absolute inset-0 opacity-[0.12]", styles.dotClassName)}
                style={{
                  backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              />
              <Sparkles
                aria-hidden="true"
                className={cn("absolute right-8 bottom-8 size-28", styles.iconClassName)}
              />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? "8%" : "-8%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? "-8%" : "8%", opacity: 0 }),
};

/**
 * Slider automático para 2+ promociones vigentes (Sprint 6.1): muestra
 * una, espera ~2s, desliza horizontalmente a la siguiente, en loop
 * infinito. Flechas + dots permiten navegar manualmente -- cualquier
 * navegación manual reinicia el temporizador porque el efecto de
 * auto-avance depende de `index` y se reinicia solo cuando éste cambia,
 * sin lógica aparte. En hover, se pausa; al salir, continúa.
 */
function PromotionCarousel({ promotions }: { promotions: PublicPromotion[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const goTo = useCallback(
    (nextIndex: number, nextDirection: number) => {
      setDirection(nextDirection);
      setIndex((nextIndex + promotions.length) % promotions.length);
    },
    [promotions.length]
  );

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % promotions.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
    // Reiniciar el temporizador en cada cambio de `index` -- ya sea por
    // auto-avance o por navegación manual (flechas/dots) -- es
    // exactamente "si navega manualmente: reiniciar el temporizador"
    // pedido por el sprint, sin ningún código aparte para eso.
  }, [paused, promotions.length, index]);

  const current = promotions[index];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={shouldReduceMotion ? undefined : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.45, ease: "easeInOut" }}
          >
            <PromotionContent promotion={current} useItemVariants={false} />
          </motion.div>
        </AnimatePresence>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Promoción anterior"
        onClick={() => goTo(index - 1, -1)}
        className={cn(
          "absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full sm:left-4",
          styles.navButton
        )}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Promoción siguiente"
        onClick={() => goTo(index + 1, 1)}
        className={cn(
          "absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full sm:right-4",
          styles.navButton
        )}
      >
        <ChevronRight className="size-5" />
      </Button>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-6">
        {promotions.map((promotion, i) => (
          <button
            key={promotion.id}
            type="button"
            aria-label={`Ir a la promoción ${i + 1}`}
            aria-current={i === index}
            onClick={() => goTo(i, i > index ? 1 : -1)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-background" : "w-2 bg-background/40 hover:bg-background/60"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Desde el Sprint 5.9 recibe las promociones vigentes por prop, resueltas
 * desde Supabase por cada página que las necesita (`getActivePromotions()`,
 * `services/storefront/promotions.ts`) -- ya no importa
 * `config/promotion.ts`. Sin ninguna promoción vigente, no se renderiza
 * nada (mismo comportamiento que antes con `promotionConfig.enabled =
 * false`). Con exactamente una, se comporta idéntico a como lo hacía
 * antes del Sprint 6.1 (mismo JSX, mismo stagger de entrada, sin flechas
 * ni dots). Con dos o más, se convierte en el carrusel de arriba.
 */
export function PromotionalBanner({ promotions }: { promotions: PublicPromotion[] }) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (promotions.length === 0) return null;

  return (
    <section className={cn("w-full", styles.section)}>
      <motion.div
        initial={mounted && shouldReduceMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={container}
      >
        {promotions.length > 1 ? (
          <PromotionCarousel promotions={promotions} />
        ) : (
          <PromotionContent promotion={promotions[0]} useItemVariants />
        )}
      </motion.div>
    </section>
  );
}
