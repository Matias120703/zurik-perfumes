"use client";

import dynamic from "next/dynamic";

import { siteConfig } from "@/config/site";

/**
 * ssr:false es obligatorio acá: `leaflet` accede a `window` al evaluar el
 * módulo, no solo al renderizar, así que ni siquiera puede llegar a
 * ejecutarse del lado del servidor. LeafletMap.tsx concentra toda la lógica
 * real del mapa; este archivo es el único que ShippingInformation conoce.
 */
const LeafletMap = dynamic(
  () => import("@/components/storefront/LeafletMap").then((mod) => mod.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl border border-border bg-muted/50 sm:h-80" />
    ),
  }
);

/**
 * Toda la lógica de mapas queda detrás de este componente: ShippingInformation
 * solo renderiza <LocationPicker /> cuando el método de entrega es Delivery,
 * sin importar nada de Leaflet ni saber que existe.
 */
export function LocationPicker() {
  const t = siteConfig.checkoutPage.shippingInformation;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{t.locationPickerLabel}</span>
        <p className="text-xs text-muted-foreground">{t.locationHint}</p>
      </div>

      <LeafletMap />
    </div>
  );
}
