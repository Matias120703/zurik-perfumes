import { ProductGrid } from "@/components/storefront/ProductGrid";
import type { Category } from "@/config/categories";
import type { Product } from "@/config/products";
import { siteConfig } from "@/config/site";
import { getPublicRelatedProducts } from "@/services/storefront/products";
import type { PublicPromotion } from "@/services/storefront/promotions";

/** Async desde el Sprint 5.3 -- ya era Server Component, solo cambió de
 * dónde saca los relacionados (Supabase en vez de config/products.ts).
 * `categories` (Sprint 5.4) la resuelve la página de producto junto con
 * el producto, y se reenvía tal cual a ProductGrid -- este componente no
 * importa config/categories.ts. `promotions` (Sprint 6.1) sigue el mismo
 * criterio, para que los relacionados también muestren su precio
 * promocional si corresponde. */
export async function RelatedProducts({
  product,
  categories,
  promotions,
}: {
  product: Product;
  categories: Category[];
  promotions: PublicPromotion[];
}) {
  const related = await getPublicRelatedProducts(product);
  const { eyebrow, title } = siteConfig.relatedProductsSection;

  if (related.length === 0) return null;

  return (
    <section className="mt-20 border-t border-border pt-16 lg:mt-24 lg:pt-20">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
      </div>

      <div className="mt-8">
        <ProductGrid products={related} categories={categories} promotions={promotions} />
      </div>
    </section>
  );
}
