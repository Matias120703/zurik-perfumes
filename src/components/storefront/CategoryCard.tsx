"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import type { Category } from "@/config/categories";
import { sectionItemVariants as item } from "@/lib/motion";

/**
 * Las categorías sembradas originalmente (Fase 8) tienen rutas locales de
 * config/categories.ts (`/categories/tecnologia.jpg`) que nunca existieron
 * como archivo real -- mismo criterio ya establecido para productos
 * (Fase 12, `lib/products.ts`). Solo una foto subida de verdad desde el
 * Panel (Sprint 6.6) llega acá como URL absoluta de Supabase Storage.
 * Copia local a propósito, mismo criterio ya documentado para
 * `ProductGallery.tsx` -- un solo consumidor acá, no cruza el umbral de
 * "3 o más lugares" que justificaría compartirla desde `lib/`.
 */
function isRealImageUrl(url: string | undefined): url is string {
  return Boolean(url && url.startsWith("http"));
}

/**
 * Extraída de FeaturedCategories (Sprint 4.4) para reutilizarla también en
 * /categorias -- mismo componente único para ambos lugares (y para
 * cualquier otra sección futura que muestre categorías), consistente con
 * el mismo criterio de reutilización ya aplicado a ProductCard.
 *
 * Rediseñada en el Sprint 6.6 para mostrar la imagen real de la categoría
 * (`category.image`, ya resuelta desde Supabase por la página que la
 * renderiza) con overlay de nombre + degradado, en vez del bloque de texto
 * separado debajo de la imagen que tenía antes -- mismo lenguaje visual
 * "imagen protagonista" que ya adoptó ProductCard (Sprint 6.7, posterior a
 * este). Sin imagen real todavía, cae al mismo placeholder decorativo de
 * siempre (gradiente + textura + inicial), ahora también con el overlay de
 * nombre encima -- para que una categoría sin foto y una con foto se vean
 * igual de terminadas en la misma grilla, nunca a medio hacer.
 */
export function CategoryCard({
  category,
  className,
}: {
  category: Category;
  /** Clases de layout que decide el contenedor (carrusel, grilla, etc). */
  className?: string;
}) {
  const initial = category.name.charAt(0);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = isRealImageUrl(category.image) && !imageFailed;

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={className}
    >
      <Link
        href={`/categorias/${category.slug}`}
        className="group relative flex aspect-[4/3] h-full flex-col overflow-hidden rounded-2xl border border-border bg-card outline-none transition-all duration-300 ease-out hover:border-foreground/15 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {showImage ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 90vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
            <div
              className="absolute inset-0"
              style={
                category.accentColor
                  ? {
                      backgroundImage: `radial-gradient(130% 100% at 100% 0%, ${category.accentColor}29, transparent 60%)`,
                    }
                  : undefined
              }
            />
            <div
              className="absolute inset-0 text-foreground opacity-[0.12]"
              style={{
                backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            <span
              aria-hidden="true"
              className="absolute -right-2 -bottom-4 text-8xl leading-none font-bold text-foreground/[0.08] select-none"
            >
              {initial}
            </span>
          </div>
        )}

        {/* Overlay ligero: degradado desde abajo, suficiente para que el
            nombre siempre se lea bien sin importar qué haya debajo (foto
            real o placeholder). */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="relative mt-auto flex items-center justify-between gap-3 p-5 text-white">
          <h3 className="text-lg font-semibold drop-shadow-sm">{category.name}</h3>
          <ArrowRight
            aria-hidden="true"
            className="size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1.5"
          />
        </div>
      </Link>
    </motion.div>
  );
}
