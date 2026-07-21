"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Product } from "@/config/products";
import { useProductShowcase } from "@/hooks/useProductShowcase";
import { isRealImageUrl } from "@/lib/products";
import { cn, formatPrice } from "@/lib/utils";

const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? "14%" : "-14%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? "-14%" : "14%", opacity: 0 }),
};

/**
 * Reemplaza el panel derecho estático del Hero (Sprint 6.3): un carrusel
 * premium de productos reales, en el mismo contenedor visual de siempre
 * (`aspect-[4/5]`, `rounded-[2rem]`, `border`) para no alterar el layout
 * que ya tenía el Hero. `products` llega resuelto por Home
 * (`getPublicHeroProducts()`) -- este componente nunca consulta Supabase,
 * solo presenta lo que ya recibió y delega el estado de rotación/pausa/
 * navegación a `useProductShowcase`.
 *
 * `AnimatePresence` con `initial={false}` evita que la primera imagen
 * anime su entrada -- eso significa que la primera pintada (servidor y
 * cliente) es siempre estática, sin depender de `useReducedMotion()`
 * (que devuelve `false` en el servidor y podría devolver `true` en el
 * cliente si el sistema operativo pide "reducir movimiento"): mismo
 * riesgo de mismatch de hidratación ya diagnosticado en `Header.tsx` y
 * `PromotionalBanner.tsx`, evitado acá desde el diseño en vez de con un
 * `mounted`-gate, porque solo hace falta para transiciones -- nunca para
 * el primer render.
 */
export function ProductShowcase({ products }: { products: Product[] }) {
  const shouldReduceMotion = useReducedMotion();
  const { current, index, direction, total, goNext, goPrev, goTo, setPaused } =
    useProductShowcase(products);

  if (!current) return null;

  const primaryImage = current.images.find(isRealImageUrl);

  return (
    <div
      // `md:max-w-md` reduce el tamaño del Showcase específicamente en
      // tablet (768-1023px, pedido explícito del sprint); `lg:max-w-none`
      // lo anula en desktop para que vuelva a ocupar toda su columna del
      // grid de dos columnas que ya tenía el Hero (sin tocar ese grid acá
      // -- esto vive enteramente adentro de este componente). En mobile
      // (<768px) no hay límite: ocupa el ancho completo, debajo del texto.
      className="relative mx-auto aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-border bg-muted/40 md:max-w-md lg:max-w-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={current.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: shouldReduceMotion ? 0.15 : 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={current.name}
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              priority={index === 0}
              className="object-cover"
            />
          ) : (
            <>
              <div className="absolute -top-10 -left-10 size-64 rounded-full bg-foreground/5 blur-3xl" />
              <div className="absolute -right-10 -bottom-16 size-72 rounded-full bg-foreground/10 blur-3xl" />
              <div
                className="absolute inset-0 text-foreground opacity-[0.15]"
                style={{
                  backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              />
            </>
          )}

          {/* Degradado para que nombre/precio/botón sean legibles sobre
              cualquier imagen, sin depender de qué tan clara u oscura sea. */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 pb-11 sm:p-8 sm:pb-12">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-balance text-foreground sm:text-2xl">
                {current.name}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(current.price)}
                </span>
                {current.oldPrice ? (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(current.oldPrice)}
                  </span>
                ) : null}
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-fit">
              <Button nativeButton={false} render={<Link href={`/productos/${current.slug}`} />}>
                Ver producto
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/*
        Flechas + indicadores viven FUERA del slide animado (a diferencia
        del nombre/precio/botón, que sí cambian con cada producto): son
        controles de navegación estables, no contenido -- si vivieran
        dentro del `motion.div` que AnimatePresence reemplaza en cada
        auto-avance, se desmontarían y remontarían cada ~1.5s, con el
        riesgo real de que un click quede "pisado" justo cuando el
        carrusel avanza solo (encontrado durante la verificación de este
        mismo sprint, con clicks intermitentemente fallidos sobre un
        indicador mientras el auto-avance seguía activo).
      */}
      {total > 1 ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Producto anterior"
            onClick={goPrev}
            className="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background/90"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Producto siguiente"
            onClick={goNext}
            className="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background/90"
          >
            <ChevronRight className="size-4" />
          </Button>

          <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5 sm:bottom-5">
            {products.map((product, dotIndex) => (
              <button
                key={product.id}
                type="button"
                aria-label={`Ver ${product.name}`}
                aria-current={dotIndex === index}
                onClick={() => goTo(dotIndex, dotIndex > index ? 1 : -1)}
                className={cn(
                  "h-2 w-2 rounded-full bg-foreground/30 transition-all hover:bg-foreground/60",
                  dotIndex === index && "w-5 bg-foreground"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
