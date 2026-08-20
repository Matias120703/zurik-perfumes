import type { Metadata } from "next";
import Link from "next/link";
import { Tag } from "lucide-react";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { siteConfig } from "@/config/site";
import { getDiscountedProducts } from "@/lib/offers";
import { getPublicCategories } from "@/services/storefront/categories";
import { getPublicHomeContent } from "@/services/storefront/home-content";
import { getPublicProducts } from "@/services/storefront/products";
import { getActivePromotions } from "@/services/storefront/promotions";

export const metadata: Metadata = {
  title: `Ofertas | ${siteConfig.name}`,
  description:
    "Perfumes originales con precio especial por tiempo limitado. Stock real y envíos a todo Paraguay.",
};

/**
 * Página dedicada a las ofertas -- el destino del botón "Ver ofertas" del
 * hero y del "Ver todas las ofertas" de la Home.
 *
 * Reutiliza `ProductGrid` tal cual (mismo componente del catálogo) y
 * `getDiscountedProducts` (`lib/offers.ts`, la misma función que usa la
 * sección de la Home): no existe una segunda definición de qué producto
 * está en oferta. Sin buscador ni orden a propósito -- es una lista
 * curada y corta, no un catálogo completo.
 */
export default async function OffersPage() {
  const [products, categories, promotions, homeContent] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
    getActivePromotions(),
    getPublicHomeContent(),
  ]);

  const offers = getDiscountedProducts(products, promotions);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Ofertas" }]} />

      <div className="mt-6 flex flex-col gap-4">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--gold)]">
          <Tag className="size-3.5" aria-hidden="true" />
          {homeContent.offersEyebrow ?? "Ofertas"}
        </span>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {homeContent.offersTitle ?? "Ofertas de la semana"}
        </h1>

        {homeContent.offersSubtitle ? (
          <p className="max-w-xl text-muted-foreground">{homeContent.offersSubtitle}</p>
        ) : null}
      </div>

      <div className="mt-10">
        {offers.length > 0 ? (
          <ProductGrid
            products={offers}
            categories={categories}
            promotions={promotions}
            dense
          />
        ) : (
          <div className="flex flex-col items-center gap-6">
            <EmptyState
              title="Por ahora no hay ofertas activas"
              description="Estamos preparando las próximas promociones. Mientras tanto, mirá el catálogo completo."
            />
            <Button nativeButton={false} render={<Link href="/productos" />}>
              Ver todos los perfumes
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
