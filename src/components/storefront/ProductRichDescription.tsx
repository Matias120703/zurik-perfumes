import { isEmptyDescriptionHtml, sanitizeDescriptionHtml } from "@/lib/sanitize-html";

/**
 * Descripción enriquecida de producto (Sprint 6.3) -- el único lugar de
 * toda la tienda que la muestra. `ProductCard`, el Catálogo, la Home, los
 * Productos Destacados y el Showcase del Hero nunca reciben esta prop:
 * ninguno de esos componentes se tocó, y `getPublicProducts()`/
 * `getPublicHeroProducts()` (services/storefront/products.ts) ni
 * siquiera seleccionan la columna `description` -- no hay forma de que
 * el contenido enriquecido llegue a esas vistas por accidente.
 *
 * Sanitiza de nuevo antes de renderizar (además de la sanitización ya
 * aplicada al guardar en `ProductForm.tsx`) -- defensa en profundidad:
 * es la última línea antes de que el HTML llegue al navegador de un
 * visitante anónimo. `dangerouslySetInnerHTML` es seguro acá porque el
 * string que recibe ya pasó por la lista blanca de `sanitizeDescriptionHtml`
 * dos veces, no HTML crudo sin filtrar.
 */
export function ProductRichDescription({ description }: { description?: string }) {
  if (!description || isEmptyDescriptionHtml(description)) return null;

  const safeHtml = sanitizeDescriptionHtml(description);

  return (
    <section className="mt-16 border-t border-border pt-10 lg:mt-20">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Descripción completa</h2>
      <div
        className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-img:rounded-xl prose-video:rounded-xl"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </section>
  );
}
