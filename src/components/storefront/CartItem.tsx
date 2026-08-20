"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";

import { isRealImageUrl } from "@/lib/products";
import { useCartStore, type CartLineItem } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";

export function CartItem({ item }: { item: CartLineItem }) {
  const { product, quantity } = item;
  const [imageFailed, setImageFailed] = useState(false);
  const primaryImage = product.images.find(isRealImageUrl);
  const showImage = Boolean(primaryImage) && !imageFailed;
  const incrementQuantity = useCartStore((state) => state.incrementQuantity);
  const decrementQuantity = useCartStore((state) => state.decrementQuantity);
  const removeProduct = useCartStore((state) => state.removeProduct);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex gap-4 border-b border-border py-6 first:pt-0 last:border-b-0"
    >
      {/*
        La foto real del producto -- hasta este sprint el carrito mostraba
        SIEMPRE el placeholder decorativo, aunque el producto tuviera una
        foto subida desde el panel: es el mismo bug que la Fase 12
        corrigió en ProductCard/ProductGallery, que nunca se había
        aplicado acá (ni en CheckoutSummary) porque Carrito y Checkout
        estuvieron protegidos en todos los sprints posteriores.

        Encima, el tinte de color venía de un `categories.find()` contra
        `config/categories.ts`, cuyos slugs son los del cliente anterior
        del engine -- para ZURIK nunca encontraba nada, así que el
        recuadro quedaba gris plano. Ese import se eliminó: el placeholder
        ahora usa el mismo monograma dorado del resto de la tienda.
      */}
      <Link
        href={`/productos/${product.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/60 transition-colors hover:border-[var(--gold)]/40 sm:size-28"
      >
        {showImage ? (
          <Image
            src={primaryImage!}
            alt={product.name}
            fill
            sizes="112px"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklab,var(--gold)_14%,transparent),transparent_65%)]" />
            <span
              aria-hidden="true"
              className="font-display absolute inset-0 flex items-center justify-center text-3xl leading-none font-semibold text-[var(--gold)]/30 select-none"
            >
              {product.name.charAt(0)}
            </span>
          </>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold text-foreground sm:text-base">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {formatPrice(product.price)} c/u
            </p>
          </div>

          <button
            type="button"
            onClick={() => removeProduct(product.id)}
            aria-label={`Quitar ${product.name} del carrito`}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div className="flex items-center gap-1 rounded-full border border-border">
            <button
              type="button"
              onClick={() => decrementQuantity(product.id)}
              disabled={quantity <= 1}
              aria-label={`Restar una unidad de ${product.name}`}
              className="flex size-8 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-4 text-center text-sm font-medium text-foreground tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => incrementQuantity(product.id)}
              aria-label={`Sumar una unidad de ${product.name}`}
              className="flex size-8 items-center justify-center text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <span className="text-sm font-bold text-foreground sm:text-base">
            {formatPrice(product.price * quantity)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
