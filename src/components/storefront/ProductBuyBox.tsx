"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";
import { sectionContainerVariants, sectionItemVariants } from "@/lib/motion";
import { getStockStatus } from "@/lib/products";
import { getProductDisplayPrice } from "@/lib/promotions";
import { cn, formatPrice, getWhatsAppUrl } from "@/lib/utils";
import type { BusinessSettings } from "@/services/storefront/business";
import type { PublicPromotion } from "@/services/storefront/promotions";
import { useCartStore } from "@/store/cart-store";

export function ProductBuyBox({
  product,
  categories,
  promotions,
  settings,
}: {
  product: Product;
  /** Resuelta desde Supabase por la página de producto (Sprint 5.4) --
   * este componente ya no importa config/categories.ts. */
  categories: Category[];
  /** Promociones vigentes (Sprint 6.1), resueltas desde Supabase por la
   * página de producto -- ver ProductCard.tsx para el mismo criterio. */
  promotions: PublicPromotion[];
  /** Resuelta desde Supabase por la página de producto (Sprint 5.5) --
   * este componente ya no importa config/business.ts. */
  settings: BusinessSettings;
}) {
  const shouldReduceMotion = useReducedMotion();
  const category = categories.find((c) => c.slug === product.category);
  const displayPrice = getProductDisplayPrice(product, promotions);
  const stockStatus = getStockStatus(product.stock);
  const outOfStock = product.stock <= 0;
  const addProduct = useCartStore((state) => state.addProduct);

  const whatsappHref = getWhatsAppUrl(
    settings.whatsappNumber,
    settings.whatsappProductInquiryTemplate.replace("{product}", product.name)
  );

  return (
    <motion.div
      initial={shouldReduceMotion ? "show" : "hidden"}
      animate="show"
      variants={sectionContainerVariants}
      className="flex flex-col gap-5"
    >
      {category ? (
        <motion.span
          variants={sectionItemVariants}
          className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          {category.name}
        </motion.span>
      ) : null}

      <motion.h1
        variants={sectionItemVariants}
        className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
      >
        {product.name}
      </motion.h1>

      {displayPrice.badgeVariant === "discount" ? (
        <motion.div variants={sectionItemVariants}>
          <Badge>{displayPrice.badgeLabel}</Badge>
        </motion.div>
      ) : displayPrice.badgeVariant === "info" ? (
        <motion.div variants={sectionItemVariants}>
          <Badge variant="outline">{displayPrice.badgeLabel}</Badge>
        </motion.div>
      ) : null}

      <motion.div variants={sectionItemVariants} className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-foreground">
          {formatPrice(displayPrice.price)}
        </span>
        {displayPrice.compareAtPrice ? (
          <span className="text-lg text-muted-foreground line-through">
            {formatPrice(displayPrice.compareAtPrice)}
          </span>
        ) : null}
      </motion.div>

      <motion.div
        variants={sectionItemVariants}
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <span className={cn("size-1.5 rounded-full", stockStatus.dotClassName)} />
        {stockStatus.label}
      </motion.div>

      <motion.p variants={sectionItemVariants} className="max-w-md text-muted-foreground">
        {product.shortDescription}
      </motion.p>

      <motion.div
        variants={sectionItemVariants}
        className="flex flex-col gap-3 pt-2 sm:flex-row"
      >
        <Button
          disabled={outOfStock}
          size="lg"
          className="w-full sm:flex-1"
          onClick={() => addProduct(product)}
        >
          {outOfStock ? "Sin stock" : "Agregar al carrito"}
        </Button>
        {outOfStock ? (
          <Button variant="outline" size="lg" disabled className="w-full sm:flex-1">
            <MessageCircle className="size-4" />
            Comprar por WhatsApp
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            className="w-full sm:flex-1"
            render={<a href={whatsappHref} target="_blank" rel="noopener noreferrer" />}
          >
            <MessageCircle className="size-4" />
            Comprar por WhatsApp
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
