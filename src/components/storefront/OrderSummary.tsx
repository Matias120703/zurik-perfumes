"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { sectionContainerVariants, sectionItemVariants } from "@/lib/motion";

/**
 * El subtotal y la cantidad de productos salen del store, nunca se
 * recalculan localmente. El envío es un placeholder a propósito (fila
 * ya lista para reglas de envío reales) y el total todavía no las suma
 * porque no existen. Cuando haya checkout, acá se conecta el cálculo
 * real de envío e impuestos.
 */
export function OrderSummary() {
  const shouldReduceMotion = useReducedMotion();
  const { title, shippingLabel, shippingPlaceholder, continueButton, disclaimer } =
    siteConfig.cartPage.summary;

  const itemCount = useCartStore((state) => state.getTotalItems());
  const subtotal = useCartStore((state) => state.getSubtotal());

  return (
    <motion.div
      initial={shouldReduceMotion ? "show" : "hidden"}
      animate="show"
      variants={sectionContainerVariants}
      className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6"
    >
      <motion.h2 variants={sectionItemVariants} className="text-lg font-semibold text-foreground">
        {title}
      </motion.h2>

      <motion.div variants={sectionItemVariants} className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>
            Subtotal ({itemCount} {itemCount === 1 ? "producto" : "productos"})
          </span>
          <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{shippingLabel}</span>
          <span className="font-medium text-foreground">{shippingPlaceholder}</span>
        </div>
      </motion.div>

      <motion.div
        variants={sectionItemVariants}
        className="flex items-center justify-between border-t border-border pt-4"
      >
        <span className="text-base font-semibold text-foreground">Total</span>
        <span className="text-xl font-bold text-foreground">{formatPrice(subtotal)}</span>
      </motion.div>

      <motion.div variants={sectionItemVariants}>
        <Button
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href="/checkout" />}
        >
          {continueButton}
        </Button>
      </motion.div>

      <motion.p variants={sectionItemVariants} className="text-center text-xs text-muted-foreground">
        {disclaimer}
      </motion.p>
    </motion.div>
  );
}
