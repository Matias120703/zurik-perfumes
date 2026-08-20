"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import type { Product } from "@/config/products";
import { useProductShowcase } from "@/hooks/useProductShowcase";
import { isRealImageUrl } from "@/lib/products";
import { cn, formatPrice } from "@/lib/utils";

const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? "10%" : "-10%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? "-10%" : "10%", opacity: 0 }),
};

/**
 * Máscara que hace que la foto se funda con el negro de la página en vez
 * de terminar en un borde recto.
 *
 * Es un degradado radial usado como `mask`: opaco en el centro (donde
 * está el frasco) y transparente hacia los bordes, así la imagen "se
 * apaga" contra el fondo. Reemplaza a la tarjeta con borde y esquinas
 * redondeadas que tenía antes, que encajonaba la foto y cortaba en seco.
 *
 * Va en `style` y no en clases de Tailwind porque son dos propiedades
 * (con el prefijo -webkit- para Safari) con un valor largo: escrito como
 * clase arbitraria queda ilegible y hay que escaparlo entero.
 */
const FADE_MASK = "radial-gradient(115% 85% at 60% 42%, #000 42%, rgba(0,0,0,.55) 66%, transparent 88%)";

/**
 * Panel derecho del Hero: los productos reales de la tienda, rotando.
 *
 * `products` llega resuelto por Home (`getPublicHeroProducts()`) -- este
 * componente nunca consulta Supabase, sólo presenta lo que recibió y
 * delega el estado de rotación/pausa/navegación a `useProductShowcase`.
 *
 * `AnimatePresence` con `initial={false}` evita que la primera imagen
 * anime su entrada -- así la primera pintada (servidor y cliente) es
 * siempre estática, sin depender de `useReducedMotion()` (que devuelve
 * `false` en el servidor y podría devolver `true` en el cliente si el
 * sistema pide "reducir movimiento"): mismo riesgo de mismatch de
 * hidratación ya diagnosticado en `Header.tsx`, evitado acá desde el
 * diseño en vez de con un `mounted`-gate.
 */
export function ProductShowcase({ products }: { products: Product[] }) {
  const shouldReduceMotion = useReducedMotion();
  const { current, index, direction, total, goNext, goPrev, goTo, setPaused } =
    useProductShowcase(products);

  if (!current) return null;

  const primaryImage = current.images.find(isRealImageUrl);

  return (
    <div
      className="relative mx-auto w-full md:max-w-md lg:max-w-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* La foto: sin marco, sin fondo, sin esquinas redondeadas. */}
      <div className="relative aspect-square w-full lg:aspect-[4/5]">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.55, ease: "easeInOut" }}
            className="absolute inset-0"
            style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
          >
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={current.name}
                fill
                sizes="(min-width: 1024px) 45vw, 90vw"
                priority={index === 0}
                className="object-contain object-center"
              />
            ) : (
              /* Sin foto real todavía: la inicial del producto en dorado,
                 con el mismo lenguaje que el resto de los placeholders. */
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className="font-display text-[12rem] leading-none font-semibold text-[var(--gold)]/15 select-none"
                >
                  {current.name.charAt(0)}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/*
        Nombre y precio: sobre el fondo de la página, no encima de la foto.
        Como la máscara ya apagó la imagen en esa zona, el texto se lee
        sobre negro y no hace falta ningún velo ni caja detrás.
      */}
      <div className="relative -mt-6 flex flex-col items-center gap-2 text-center lg:-mt-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-1.5"
          >
            <h3 className="font-display text-xl font-semibold text-balance text-foreground sm:text-2xl">
              {current.name}
            </h3>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-base font-semibold text-[var(--gold)] sm:text-lg">
                {formatPrice(current.price)}
              </span>
              {current.oldPrice ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(current.oldPrice)}
                </span>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>

        <Link
          href={`/productos/${current.slug}`}
          className="group/link mt-1 inline-flex items-center gap-1.5 border-b border-[var(--gold)]/30 pb-0.5 text-xs font-medium tracking-wide text-[var(--gold)] uppercase transition-colors hover:border-[var(--gold)]"
        >
          Ver producto
          <ArrowRight
            className="size-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/*
        Flechas e indicadores viven FUERA del slide animado (a diferencia
        del nombre/precio, que sí cambian con cada producto): son controles
        estables, no contenido -- si vivieran dentro del `motion.div` que
        AnimatePresence reemplaza en cada auto-avance, se desmontarían y
        remontarían cada ~1.5s, con el riesgo real de que un click quede
        "pisado" justo cuando el carrusel avanza solo.
      */}
      {total > 1 ? (
        <>
          <button
            type="button"
            aria-label="Producto anterior"
            onClick={goPrev}
            className="absolute top-[38%] left-0 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--gold)]/25 bg-background/60 text-[var(--gold)] backdrop-blur-sm transition-colors hover:border-[var(--gold)]/60 hover:bg-background/90"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Producto siguiente"
            onClick={goNext}
            className="absolute top-[38%] right-0 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--gold)]/25 bg-background/60 text-[var(--gold)] backdrop-blur-sm transition-colors hover:border-[var(--gold)]/60 hover:bg-background/90"
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="relative mt-5 flex justify-center gap-1.5">
            {products.map((product, dotIndex) => (
              <button
                key={product.id}
                type="button"
                aria-label={`Ver ${product.name}`}
                aria-current={dotIndex === index}
                onClick={() => goTo(dotIndex, dotIndex > index ? 1 : -1)}
                className={cn(
                  "h-1.5 w-1.5 rounded-full bg-foreground/25 transition-all hover:bg-[var(--gold)]/70",
                  dotIndex === index && "w-5 bg-[var(--gold)]"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
