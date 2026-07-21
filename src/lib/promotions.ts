import { formatPrice } from "@/lib/utils";
import type { Product } from "@/config/products";

export type DiscountType = "percentage" | "fixed_amount";
export type PromotionStatus = "active" | "scheduled" | "expired" | "inactive";

/** Función pura, sin JSX -- reutilizada tanto por la tabla del panel
 * (columna "Descuento") como por el banner público (badge "-15%"). */
export function formatDiscountLabel(discountType: DiscountType, discountValue: number): string {
  if (discountType === "percentage") return `-${discountValue}%`;
  return `-${formatPrice(discountValue)}`;
}

/**
 * `is_active` (apagado manual) y las fechas de vigencia son dos cosas
 * independientes (docs/database-architecture.md, sección 4.7) -- esta
 * función las combina en un único estado legible para el panel. La
 * tienda pública no necesita esto: RLS (`promotions_public_read_active`)
 * ya filtra `is_active = true and now() between starts_at and ends_at`
 * directamente en la base, así que una promoción vencida o programada
 * nunca llega siquiera a la respuesta que ve `anon`.
 */
export function getPromotionStatus(promotion: {
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}): PromotionStatus {
  if (!promotion.isActive) return "inactive";
  const now = Date.now();
  if (now < new Date(promotion.startsAt).getTime()) return "scheduled";
  if (now > new Date(promotion.endsAt).getTime()) return "expired";
  return "active";
}

/**
 * Forma mínima que necesita el motor de precios (Sprint 6.1) -- a
 * propósito no es (ni importa) `PublicPromotion`
 * (`services/storefront/promotions.ts`): ese archivo ya importa de acá
 * (`formatDiscountLabel`/`DiscountType`), así que importar su tipo de
 * vuelta crearía una dependencia circular `lib` <-> `services`. Cualquier
 * `PublicPromotion` ya cumple esta forma de manera estructural (tiene
 * estos mismos campos y más), así que se le puede pasar tal cual a
 * `calculatePromotion`/`getProductDisplayPrice` sin ningún cast.
 */
export type PricingPromotion = {
  discountType: DiscountType;
  discountValue: number;
  productId: string | null;
  categorySlug: string | null;
  discountLabel: string;
};

export type PromotionPriceResult = {
  originalPrice: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountType: DiscountType | null;
  badge: string | null;
  appliedPromotion: PricingPromotion | null;
};

/**
 * Motor único de precios promocionales (Sprint 6.1) -- ningún componente
 * debe calcular un descuento por su cuenta (CLAUDE.md, principio 2).
 *
 * Prioridad fija, sin acumular: 1) promoción del producto puntual, 2)
 * promoción de su categoría, nunca las dos a la vez -- ni siquiera dos
 * promociones de la misma categoría o del mismo producto (si existiera
 * más de una vigente al mismo tiempo, se aplica la primera del array,
 * que `getActivePromotions()` ya entrega ordenada por más reciente).
 */
export function calculatePromotion(
  product: Pick<Product, "id" | "category" | "price">,
  promotions: PricingPromotion[]
): PromotionPriceResult {
  const applied =
    promotions.find((promotion) => promotion.productId === product.id) ??
    promotions.find((promotion) => promotion.categorySlug === product.category) ??
    null;

  if (!applied) {
    return {
      originalPrice: product.price,
      finalPrice: product.price,
      hasDiscount: false,
      discountType: null,
      badge: null,
      appliedPromotion: null,
    };
  }

  const rawFinalPrice =
    applied.discountType === "percentage"
      ? product.price * (1 - applied.discountValue / 100)
      : product.price - applied.discountValue;

  const finalPrice = Math.max(0, Math.round(rawFinalPrice));

  return {
    originalPrice: product.price,
    finalPrice,
    hasDiscount: finalPrice < product.price,
    discountType: applied.discountType,
    badge: applied.discountLabel,
    appliedPromotion: applied,
  };
}

export type ProductDisplayPrice = {
  /** Precio final a mostrar (con descuento aplicado si corresponde). */
  price: number;
  /** Precio original tachado -- null si no hay ningún tachado que mostrar. */
  compareAtPrice: number | null;
  /** Texto del badge a mostrar -- null si no corresponde ninguno. */
  badgeLabel: string | null;
  /** "discount": descuento real (promoción vigente o el legacy
   * `on_sale`/`old_price`) -- fondo sólido. "info": el `product.badge` de
   * texto libre ("Nuevo", "Más vendido"), sin relación a un descuento --
   * fondo outline. null si no hay ningún badge. Decide QUÉ mostrar; el
   * componente sigue decidiendo CÓMO (clases/variant de `Badge`). */
  badgeVariant: "discount" | "info" | null;
};

/**
 * Resuelve qué precio/tachado/badge mostrar para un producto, combinando
 * el motor de promociones de arriba con el comportamiento legacy ya
 * aprobado (`product.oldPrice`/`onSale`/`badge`, Fases 2-3) cuando ninguna
 * promoción de Supabase aplica -- así los componentes siguen mostrando
 * exactamente lo mismo que mostraban antes de este sprint para cualquier
 * producto sin promoción vigente, sin decidir esa combinación por su
 * cuenta. Única función reutilizada por `ProductCard`/`ProductBuyBox`.
 */
export function getProductDisplayPrice(
  product: Pick<Product, "id" | "category" | "price" | "oldPrice" | "onSale" | "badge">,
  promotions: PricingPromotion[]
): ProductDisplayPrice {
  const pricing = calculatePromotion(product, promotions);

  if (pricing.hasDiscount && pricing.appliedPromotion) {
    return {
      price: pricing.finalPrice,
      compareAtPrice: pricing.originalPrice,
      badgeLabel: pricing.badge,
      badgeVariant: "discount",
    };
  }

  const legacyDiscountPercent = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;
  const isLegacyOnSale = product.onSale && Boolean(legacyDiscountPercent);

  return {
    price: product.price,
    compareAtPrice: product.oldPrice ?? null,
    badgeLabel: isLegacyOnSale ? `-${legacyDiscountPercent}%` : (product.badge ?? null),
    badgeVariant: isLegacyOnSale ? "discount" : product.badge ? "info" : null,
  };
}
