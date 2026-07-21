import { createClient } from "@/lib/supabase/server";
import { formatDiscountLabel, type DiscountType } from "@/lib/promotions";
import { isRealImageUrl } from "@/lib/products";

/**
 * Lectura pública de `promotions` (Sprint 5.9, extendida en el Sprint
 * 6.1) -- mismo criterio que el resto de `services/storefront/`: cliente
 * de servidor, sin capa de hooks. RLS (`promotions_public_read_active`)
 * ya filtra `is_active = true and now() between starts_at and ends_at`
 * del lado de Supabase -- una promoción vencida o programada nunca llega
 * acá, no hace falta repetir ese filtro en la aplicación (se repite de
 * todos modos explícitamente más abajo, ver el "por qué" del Sprint
 * 6.0.1, bug 4).
 *
 * Desde el Sprint 6.1, `PublicPromotion` incluye los campos crudos
 * (`discountType`/`discountValue`/`productId`/`categorySlug`) que
 * necesita el motor de precios (`lib/promotions.ts`, `calculatePromotion`)
 * -- esta capa sigue sin escribir nada en `products`: el precio
 * promocional se calcula en memoria, en cada request, nunca se guarda.
 */

export type PublicPromotion = {
  id: string;
  title: string;
  description: string | null;
  discountLabel: string;
  targetLabel: string;
  targetHref: string;
  /** Solo cuando la promoción es de un producto específico: su imagen
   * principal, reutilizada de `product_images` -- null si el producto no
   * tiene ninguna foto real todavía, o si la promoción es de categoría
   * (bug 2, Sprint 6.0.1: sin campo nuevo, sin duplicar imágenes). */
  imageUrl: string | null;
  /** Campos crudos (Sprint 6.1), consumidos por `calculatePromotion`
   * (`lib/promotions.ts`) para decidir prioridad y calcular el precio
   * final -- `null` cuando la promoción es del otro tipo de destino
   * (nunca los dos a la vez, `promotions_target_check`). */
  discountType: DiscountType;
  discountValue: number;
  productId: string | null;
  categorySlug: string | null;
};

type PublicPromotionRow = {
  id: string;
  title: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  product_id: string | null;
  categories: { name: string; slug: string } | null;
  products: {
    name: string;
    slug: string;
    product_images: { url: string; display_order: number }[];
  } | null;
};

const PUBLIC_PROMOTION_SELECT = `
  id, title, description, discount_type, discount_value, product_id,
  categories ( name, slug ),
  products ( name, slug, product_images ( url, display_order ) )
`;

/** Misma foto que usaría la ficha del producto: la de menor
 * `display_order` entre las que son URLs reales de Storage -- ver
 * `isRealImageUrl` (lib/products.ts) para por qué no cualquier valor de
 * `product_images.url` cuenta como foto real. */
function getPrimaryProductImage(images: { url: string; display_order: number }[]): string | null {
  const primary = [...images]
    .sort((a, b) => a.display_order - b.display_order)
    .find((image) => isRealImageUrl(image.url));
  return primary?.url ?? null;
}

function mapPublicPromotion(row: PublicPromotionRow): PublicPromotion | null {
  const target = row.categories
    ? { label: row.categories.name, href: `/categorias/${row.categories.slug}` }
    : row.products
      ? { label: row.products.name, href: `/productos/${row.products.slug}` }
      : null;

  // No debería pasar (promotions_target_check exige categoría o producto),
  // pero si el producto/categoría asociado fue borrado (on delete cascade
  // ya se encarga de esto a nivel de fila) esta fila no debería existir --
  // guarda defensiva, no un caso esperado.
  if (!target) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    discountLabel: formatDiscountLabel(row.discount_type, Number(row.discount_value)),
    targetLabel: target.label,
    targetHref: target.href,
    imageUrl: row.products ? getPrimaryProductImage(row.products.product_images) : null,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    productId: row.product_id,
    categorySlug: row.categories?.slug ?? null,
  };
}

/**
 * Todas las promociones vigentes ahora mismo, ordenadas de la más
 * reciente a la más vieja (Sprint 6.1) -- reemplaza a la antigua
 * `getActivePromotion()` (singular, `.limit(1)`): tanto el banner
 * rotativo (`PromotionalBanner.tsx`, ahora un carrusel cuando hay 2+)
 * como el motor de precios (`calculatePromotion`, aplicado en cada
 * página que muestra productos) necesitan el conjunto completo, no solo
 * la más reciente -- una sola consulta, reutilizada por ambos, en vez de
 * repetirla.
 *
 * RLS (`promotions_public_read_active`) ya filtra `is_active = true and
 * now() between starts_at and ends_at` para `anon`, pero convive con
 * `promotions_admin_read_all` (`to authenticated using (is_admin())`) --
 * con una sesión de admin activa en el mismo navegador, la request corre
 * como `authenticated` y vería promociones vencidas o programadas
 * también. Se repite el mismo filtro acá explícitamente (mismo criterio
 * que el bug 4 del Sprint 6.0.1) para que el resultado nunca dependa de
 * qué sesión traiga la request.
 */
export async function getActivePromotions(): Promise<PublicPromotion[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("promotions")
    .select(PUBLIC_PROMOTION_SELECT)
    .eq("is_active", true)
    .lte("starts_at", nowIso)
    .gte("ends_at", nowIso)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as PublicPromotionRow[])
    .map(mapPublicPromotion)
    .filter((promotion): promotion is PublicPromotion => promotion !== null);
}
