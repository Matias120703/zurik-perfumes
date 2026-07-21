"use client";

import { motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";

import { categories } from "@/config/categories";
import { useCartStore, type CartLineItem } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";

export function CartItem({ item }: { item: CartLineItem }) {
  const { product, quantity } = item;
  const category = categories.find((c) => c.slug === product.category);
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
        product.images queda reservado para cuando haya foto real del
        cliente. Mismo placeholder de diseño que el resto de la tienda,
        a menor escala.
      */}
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/60 sm:size-28">
        <div
          className="absolute inset-0"
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
            backgroundSize: "14px 14px",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute -right-2 -bottom-3 text-5xl leading-none font-bold text-foreground/[0.08] select-none"
        >
          {product.name.charAt(0)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold text-foreground sm:text-base">
              {product.name}
            </h3>
            {category ? (
              <p className="text-xs text-muted-foreground sm:text-sm">{category.name}</p>
            ) : null}
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
