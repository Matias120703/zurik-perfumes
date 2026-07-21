"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";
import { cn } from "@/lib/utils";

/** Rota el origen del gradiente por índice para que cambiar de miniatura se note. */
const GRADIENT_ORIGINS = ["100% 0%", "0% 0%", "100% 100%", "0% 100%"];

/** Misma señal que ProductCard: solo una URL absoluta es una foto real de Storage. */
function isRealImageUrl(url: string | undefined): url is string {
  return Boolean(url && url.startsWith("http"));
}

export function ProductGallery({
  product,
  categories,
}: {
  product: Product;
  /** Resuelta desde Supabase por la página de producto (Sprint 5.4) --
   * este componente ya no importa config/categories.ts. */
  categories: Category[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());
  const shouldReduceMotion = useReducedMotion();
  const category = categories.find((c) => c.slug === product.category);
  const initial = product.name.charAt(0);

  const activeImage =
    isRealImageUrl(product.images[activeIndex]) && !failedIndexes.has(activeIndex)
      ? product.images[activeIndex]
      : undefined;

  function markFailed(index: number) {
    setFailedIndexes((prev) => new Set(prev).add(index));
  }

  return (
    <div className="flex flex-col gap-4">
      {/*
        Si la imagen activa es una foto real subida desde el Panel (URL
        absoluta de Supabase Storage), se muestra esa foto. Mientras no
        exista, cada índice muestra el mismo placeholder de diseño con una
        leve variación, para que el cambio de imagen al clickear una
        miniatura sea perceptible.
      */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted/60">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority={activeIndex === 0}
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
                onError={() => markFailed(activeIndex)}
              />
            ) : (
              <>
                <div
                  className="absolute inset-0"
                  style={
                    category?.accentColor
                      ? {
                          backgroundImage: `radial-gradient(130% 100% at ${GRADIENT_ORIGINS[activeIndex % GRADIENT_ORIGINS.length]}, ${category.accentColor}29, transparent 60%)`,
                        }
                      : undefined
                  }
                />
                <div
                  className="absolute inset-0 text-foreground opacity-[0.12]"
                  style={{
                    backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <span
                  aria-hidden="true"
                  className="absolute -right-3 -bottom-6 text-9xl leading-none font-bold text-foreground/[0.08] select-none"
                >
                  {initial}
                </span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {product.images.length > 1 ? (
        <div className="flex gap-3">
          {product.images.map((url, index) => {
            const thumbImage = isRealImageUrl(url) && !failedIndexes.has(index) ? url : undefined;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                aria-current={index === activeIndex}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted/60 transition-colors sm:size-20",
                  index === activeIndex
                    ? "border-foreground"
                    : "border-border hover:border-foreground/40"
                )}
              >
                {thumbImage ? (
                  <Image
                    src={thumbImage}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={() => markFailed(index)}
                  />
                ) : (
                  <div
                    className="absolute inset-0 text-foreground opacity-[0.12]"
                    style={{
                      backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                      backgroundSize: "10px 10px",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
