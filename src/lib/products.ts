export function getStockStatus(stock: number) {
  if (stock <= 0) {
    return { label: "Sin stock", dotClassName: "bg-muted-foreground" } as const;
  }
  if (stock <= 5) {
    return { label: "¡Últimas unidades!", dotClassName: "bg-amber-500" } as const;
  }
  return { label: "En stock", dotClassName: "bg-emerald-500" } as const;
}

/**
 * Distingue una foto real de Supabase Storage (URL absoluta) de las rutas
 * de placeholder que trajo el seed original (`/products/iphone-14-1.jpg`,
 * nunca existieron como archivo real) -- mismo criterio ya usado en
 * `ProductCard.tsx`/`ProductGallery.tsx` (duplicado ahí a propósito desde
 * la Fase 12, mientras solo tenían dos consumidores). Con un tercer
 * consumidor (`services/storefront/promotions.ts`, Sprint 6.0.1) se cruza
 * el umbral de "3 o más lugares" que este proyecto usa para decidir
 * cuándo compartir código (CLAUDE.md, principio 6) -- se comparte acá
 * para el código nuevo, sin tocar los dos duplicados ya aprobados.
 */
export function isRealImageUrl(url: string | undefined): url is string {
  return Boolean(url && url.startsWith("http"));
}
