"use client";

import { motion, useReducedMotion } from "framer-motion";

import Image from "next/image";

import { isRealImageUrl } from "@/lib/products";
import { siteConfig } from "@/config/site";
import { sectionContainerVariants, sectionItemVariants } from "@/lib/motion";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";

/**
 * Los productos/subtotal salen del Cart Store, sin cambios. El envío
 * (Sprint 6.2) sale de useCheckoutStore -- lo calcula ShippingCitySelect en
 * cuanto se elige una ciudad -- reemplazando el placeholder estático de
 * siempre solo una vez que `shippingChecked` es true; hasta entonces (o en
 * "Retiro en tienda", que no tiene envío) se ve exactamente igual que antes
 * de este sprint.
 */
export function CheckoutSummary() {
  const shouldReduceMotion = useReducedMotion();
  const t = siteConfig.checkoutPage.summary;

  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.getTotalItems());
  const subtotal = useCartStore((state) => state.getSubtotal());

  const isPickup = useCheckoutStore((state) => state.values.deliveryMethod === "pickup");
  const shippingChecked = useCheckoutStore((state) => state.shippingChecked);
  const shippingCost = useCheckoutStore((state) => state.shippingCost);

  const showRealShipping = !isPickup && shippingChecked;
  const shippingLine = !showRealShipping
    ? t.shippingPlaceholder
    : shippingCost !== null
      ? formatPrice(shippingCost)
      : siteConfig.checkoutPage.shippingInformation.shippingCostToConfirm;
  const total = subtotal + (showRealShipping ? (shippingCost ?? 0) : 0);

  return (
    <motion.div
      initial={shouldReduceMotion ? "show" : "hidden"}
      animate="show"
      variants={sectionContainerVariants}
      className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6"
    >
      <motion.h2 variants={sectionItemVariants} className="text-lg font-semibold text-foreground">
        {t.title}
      </motion.h2>

      <motion.div variants={sectionItemVariants} className="flex flex-col gap-4">
        {items.map((item) => {
          /*
            Misma corrección que en CartItem: acá también se mostraba
            siempre el placeholder, incluso con foto real cargada. Ver el
            comentario largo en `CartItem.tsx` para el porqué.
          */
          const primaryImage = item.product.images.find(isRealImageUrl);

          return (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/60">
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={item.product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklab,var(--gold)_14%,transparent),transparent_65%)]" />
                    <span
                      aria-hidden="true"
                      className="font-display absolute inset-0 flex items-center justify-center text-lg leading-none font-semibold text-[var(--gold)]/30 select-none"
                    >
                      {item.product.name.charAt(0)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{item.product.name}</span>
                <span className="text-xs text-muted-foreground">Cantidad: {item.quantity}</span>
              </div>

              <span className="text-sm font-semibold text-foreground">
                {formatPrice(item.product.price * item.quantity)}
              </span>
            </div>
          );
        })}
      </motion.div>

      <motion.div
        variants={sectionItemVariants}
        className="flex flex-col gap-3 border-t border-border pt-4 text-sm"
      >
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{t.itemCountLabel}</span>
          <span className="font-medium text-foreground tabular-nums">{itemCount}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{t.subtotalLabel}</span>
          <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{t.shippingLabel}</span>
          <span className="font-medium text-foreground">{shippingLine}</span>
        </div>
      </motion.div>

      <motion.div
        variants={sectionItemVariants}
        className="flex items-center justify-between border-t border-border pt-4"
      >
        <span className="text-base font-semibold text-foreground">Total</span>
        <span className="text-xl font-bold text-foreground">{formatPrice(total)}</span>
      </motion.div>
    </motion.div>
  );
}
