"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";
import { cn, formatPrice } from "@/lib/utils";
import { sectionItemVariants as item } from "@/lib/motion";
import { getStockStatus, isRealImageUrl } from "@/lib/products";
import { getProductDisplayPrice } from "@/lib/promotions";
import type { PublicPromotion } from "@/services/storefront/promotions";
import { useCartStore } from "@/store/cart-store";

export function ProductCard({
  product,
  categories,
  promotions,
  className,
  dense,
}: {
  product: Product;
  /** Resuelta desde Supabase por la página que renderiza esta grilla
   * (Sprint 5.4) -- este componente ya no importa config/categories.ts. */
  categories: Category[];
  /** Promociones vigentes (Sprint 6.1), resueltas desde Supabase por la
   * misma página -- el precio/badge se calculan acá con
   * `getProductDisplayPrice`, este componente nunca calcula un descuento
   * por su cuenta. */
  promotions: PublicPromotion[];
  /** Clases de layout que decide el contenedor (carrusel, grilla, etc). */
  className?: string;
  /**
   * Sprint 6.4.1: reenviado por `ProductGrid` cuando el catálogo pide 2
   * columnas en mobile -- padding/gaps más chicos, título a 2 líneas
   * (en vez de 1) y un `sizes` de `next/image` ajustado a una tarjeta más
   * angosta. Sin este prop (Productos Relacionados en la página
   * individual, protegida este sprint, y el carrusel de la Home, que ni
   * siquiera pasa por `ProductGrid`), la tarjeta se ve exactamente igual
   * que antes de este sprint -- cero cambio de píxeles.
   */
  dense?: boolean;
}) {
  const category = categories.find((c) => c.slug === product.category);
  const displayPrice = getProductDisplayPrice(product, promotions);
  const stockStatus = getStockStatus(product.stock);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && stockStatus.label === "¡Últimas unidades!";
  const addProduct = useCartStore((state) => state.addProduct);
  const [imageFailed, setImageFailed] = useState(false);
  /**
   * Sprint 6.7: `product.images` ya es un array completo (no solo la
   * primera foto) -- acá solo se usa la primera real como portada, pero la
   * arquitectura queda lista para una futura mejora (cambiar a
   * `product.images[1]` en `onMouseEnter` para un "swap" al pasar el
   * mouse) sin necesitar ningún cambio de datos, únicamente de este
   * componente. No implementado todavía, a propósito -- fuera de alcance
   * de este sprint.
   */
  const primaryImage = product.images.find(isRealImageUrl);
  const showImage = Boolean(primaryImage) && !imageFailed;

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={className}
    >
      {/*
        Si el producto tiene una foto real subida desde el Panel (URL
        absoluta de Supabase Storage), se muestra esa foto. Mientras no
        exista (los 5 productos sembrados originalmente, o cualquier
        producto sin fotos todavía), se muestra el mismo placeholder de
        diseño de siempre (mismo lenguaje visual que Hero y Categorías)
        tintado con el accentColor de su categoría.
      */}
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 ease-out hover:border-foreground/15 hover:shadow-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
        {/*
          Toda la superficie informativa (imagen + nombre + precio) navega
          a la página del producto -- "Agregar al carrito" queda fuera del
          Link a propósito: un <button> anidado dentro de un <a> es HTML
          inválido y capturaría el click de navegación, así que vive como
          hermano en el mismo contenedor. La descripción corta y el estado
          de stock (antes una fila con texto+punto de color) se sacaron de
          la tarjeta -- no estaban en la lista de información pedida para
          el rediseño, y "últimas unidades" pasó a ser un badge sobre la
          imagen, igual que el descuento.
        */}
        <Link
          href={`/productos/${product.slug}`}
          className="flex flex-1 flex-col outline-none"
        >
          <div
            className={cn(
              "relative aspect-square overflow-hidden bg-muted/60",
              outOfStock && "opacity-70 grayscale-[0.35]"
            )}
          >
            {showImage ? (
              <Image
                src={primaryImage!}
                alt={product.name}
                fill
                sizes={
                  dense
                    ? "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    : "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                }
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <>
                <div
                  className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                  style={
                    category?.accentColor
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
                  {product.name.charAt(0)}
                </span>
              </>
            )}

            <div
              className={cn(
                "absolute flex flex-col items-start",
                dense ? "top-1.5 left-1.5 gap-1" : "top-2.5 left-2.5 gap-1.5"
              )}
            >
              {displayPrice.badgeVariant === "discount" ? (
                <Badge className="shadow-sm">{displayPrice.badgeLabel}</Badge>
              ) : displayPrice.badgeVariant === "info" ? (
                <Badge
                  variant="outline"
                  className="bg-background/95 shadow-sm backdrop-blur-sm"
                >
                  {displayPrice.badgeLabel}
                </Badge>
              ) : null}
              {lowStock ? (
                <Badge
                  variant="outline"
                  className="bg-background/95 text-amber-600 shadow-sm backdrop-blur-sm dark:text-amber-400"
                >
                  Últimas unidades
                </Badge>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "flex flex-1 flex-col",
              dense ? "gap-1 p-2 pb-1.5 sm:p-3 sm:pb-2" : "gap-1.5 p-3 pb-2 sm:p-4 sm:pb-2"
            )}
          >
            <h3
              className={cn(
                "font-medium text-foreground",
                dense ? "line-clamp-2 text-sm" : "line-clamp-1 text-sm sm:text-base"
              )}
              title={product.name}
            >
              {product.name}
            </h3>

            <div className={cn("flex items-baseline", dense ? "gap-1" : "gap-1.5")}>
              <span
                className={cn(
                  "font-semibold text-foreground",
                  dense ? "text-sm sm:text-base" : "text-base sm:text-lg"
                )}
              >
                {formatPrice(displayPrice.price)}
              </span>
              {displayPrice.compareAtPrice ? (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(displayPrice.compareAtPrice)}
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        <div className={dense ? "px-2 pb-2 sm:px-3 sm:pb-3" : "px-3 pb-3 sm:px-4 sm:pb-4"}>
          <Button
            size="sm"
            disabled={outOfStock}
            className="w-full"
            onClick={() => addProduct(product)}
          >
            {outOfStock ? "Sin stock" : "Agregar al carrito"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
