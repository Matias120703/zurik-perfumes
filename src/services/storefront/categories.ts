import type { Category } from "@/config/categories";
import { createClient } from "@/lib/supabase/server";

/**
 * Mismo criterio que services/storefront/products.ts -- cliente de
 * servidor, mismo `Category` de siempre. RLS (`categories_public_read_active`)
 * ya filtra `is_active = true` para el rol `anon`, pero esa policy
 * convive con `categories_admin_read_all` (`to authenticated using
 * (is_admin())`) -- si quien navega la tienda pública tiene, en el mismo
 * navegador, una sesión de admin activa (por ejemplo, probando el panel y
 * la tienda en dos pestañas), esta consulta correría como `authenticated`
 * y ambas policies se combinan con OR: seguiría viendo categorías
 * inactivas, porque RLS decide por rol, no por ruta. Se agrega
 * `.eq("is_active", true)` explícito acá (bug 4, Sprint 6.0.1) para que
 * la tienda pública nunca dependa de qué sesión traiga la request -- RLS
 * sigue siendo el filtro real para `anon`, esto es una segunda capa.
 */

type PublicCategoryRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string;
  accent_color: string | null;
};

const PUBLIC_CATEGORY_SELECT = "id, name, slug, image_url, description, accent_color";

function mapPublicCategory(row: PublicCategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image_url ?? "",
    description: row.description,
    accentColor: row.accent_color ?? undefined,
  };
}

export async function getPublicCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(PUBLIC_CATEGORY_SELECT)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as PublicCategoryRow[]).map(mapPublicCategory);
}

export async function getPublicCategoryBySlug(slug: string): Promise<Category | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(PUBLIC_CATEGORY_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapPublicCategory(data as PublicCategoryRow) : undefined;
}
