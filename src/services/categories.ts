import { createClient } from "@/lib/supabase/client";
import { assertRowAffected } from "@/lib/supabase/assert-write";

/**
 * Toda la comunicación con la tabla `categories` vive acá -- ningún
 * componente ni hook arma una query de Supabase por su cuenta, mismo
 * criterio que `services/products.ts`. `AdminCategory` es un tipo propio
 * del panel (no el `Category` de config/categories.ts que sigue usando la
 * tienda pública): incluye `productCount`, un dato que la tienda pública
 * nunca necesita.
 *
 * Extendido en el Sprint 5.4: antes (Fase 10) este archivo solo tenía
 * `listCategories()` de solo lectura para el selector del formulario de
 * productos -- se amplía en el mismo archivo, no en uno nuevo, porque
 * sigue siendo "toda la comunicación con `categories`" (mismo criterio que
 * ya separa un archivo de servicio por tabla).
 *
 * Extendido de nuevo en el Sprint 6.6: `image_url` ya existía en la tabla
 * desde el diseño original (Fase 8), nullable, sin ningún consumidor de
 * escritura hasta ahora -- `services/storefront/categories.ts` ya la leía
 * desde la Fase 11 (Category.image), pero el panel nunca ofreció subirla.
 * Este archivo suma `imageUrl` a los dos tipos existentes de forma
 * aditiva, sin romper ningún consumidor que ya destructuraba `AdminCategory`.
 */

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  accentColor: string | null;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
};

export type CategoryFormInput = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  accentColor: string | null;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
};

/**
 * Mismo límite configurado en el bucket "category-images"
 * (`supabase/migrations/..._create_category_images_bucket.sql`,
 * `file_size_limit = 5242880`) -- duplicado a propósito, mismo criterio ya
 * documentado para `MAX_BRANDING_FILE_SIZE_BYTES` (`services/settings.ts`,
 * Fase 14): no hay forma de leer el límite del bucket desde el cliente sin
 * una consulta extra, y validar en el cliente antes de subir (en vez de
 * enterarse recién con un 413 de Storage) es la experiencia que ya
 * estableció el bug 5 del Sprint 6.0.1.
 */
export const MAX_CATEGORY_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_CATEGORY_IMAGE_SIZE_MB = 5;

/** Mismo criterio: validar el tipo de archivo en el cliente, en vez de
 * confiar únicamente en `allowed_mime_types` del bucket -- ese sigue
 * siendo el límite real (defensa en profundidad), esto es solo mejor UX. */
export const ALLOWED_CATEGORY_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  accent_color: string | null;
  icon_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  products: { count: number }[] | null;
};

const CATEGORY_SELECT = `
  id, name, slug, description, image_url, accent_color, icon_name, display_order, is_active, created_at,
  products ( count )
`;

function mapCategoryRow(row: CategoryRow): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    accentColor: row.accent_color,
    iconName: row.icon_name,
    displayOrder: row.display_order,
    isActive: row.is_active,
    productCount: row.products?.[0]?.count ?? 0,
    createdAt: row.created_at,
  };
}

export async function listCategories(): Promise<AdminCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as unknown as CategoryRow[]).map(mapCategoryRow);
}

export async function getCategoryById(id: string): Promise<AdminCategory | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCategoryRow(data as unknown as CategoryRow) : null;
}

/** Chequeo proactivo para el formulario (mejor UX que esperar el error de la
 * base) -- el índice único `categories_slug_key` (Fase 8) es quien de
 * verdad garantiza la unicidad; esto es solo la validación de UI. */
export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = createClient();
  let query = supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

function toRow(input: CategoryFormInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    image_url: input.imageUrl,
    accent_color: input.accentColor,
    icon_name: input.iconName,
    display_order: input.displayOrder,
    is_active: input.isActive,
  };
}

export async function createCategory(input: CategoryFormInput): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(toRow(input))
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Ya existe una categoría con ese slug.");
    throw new Error(error.message);
  }
  return data.id as string;
}

export async function updateCategory(id: string, input: CategoryFormInput): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(toRow(input))
    .eq("id", id)
    .select("id");
  if (error) {
    if (error.code === "23505") throw new Error("Ya existe una categoría con ese slug.");
    throw new Error(error.message);
  }
  assertRowAffected(
    data,
    "No se pudo actualizar la categoría: no tenés permisos de administrador o la categoría ya no existe."
  );
}

/** Cuántos productos referencian hoy esta categoría -- usado tanto para
 * decidir si el borrado se puede intentar como para el chequeo final,
 * fresco, justo antes de borrar (ver deleteCategory). */
export async function getCategoryProductCount(categoryId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * No rompe integridad referencial: `products.category_id` ya tiene
 * `on delete restrict` (Fase 8) -- Postgres directamente rechaza el
 * borrado si hay productos asociados. Acá se hace además un chequeo
 * proactivo (mejor mensaje, sin depender del texto crudo del error de
 * Postgres) y se conserva el catch de "23503" como red de seguridad ante
 * una carrera (otro admin crea un producto justo entre el chequeo y el
 * borrado).
 */
export async function deleteCategory(id: string): Promise<void> {
  const productCount = await getCategoryProductCount(id);
  if (productCount > 0) {
    throw new Error(
      `No se puede eliminar: tiene ${productCount} producto${productCount === 1 ? "" : "s"} asociado${productCount === 1 ? "" : "s"}. Reasigná o eliminá esos productos primero.`
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.from("categories").delete().eq("id", id).select("id");
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: todavía tiene productos asociados. Reasigná o eliminá esos productos primero."
      );
    }
    throw new Error(error.message);
  }
  assertRowAffected(
    data,
    "No se pudo eliminar la categoría: no tenés permisos de administrador o la categoría ya no existe."
  );
}
