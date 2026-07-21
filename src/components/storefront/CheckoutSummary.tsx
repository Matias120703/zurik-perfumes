"use client";

import { motion, useReducedMotion } from "framer-motion";

import { categories } from "@/config/categories";
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
          const category = categories.find((c) => c.slug === item.product.category);

          return (
            <div key={item.product.id} className="flex items-center gap-3">
              {/*
                item.product.images queda reservado para la foto real.
                Mismo placeholder de diseño que el resto de la tienda.
              */}
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/60">
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
                    backgroundSize: "10px 10px",
                  }}
                />
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
