import { createClient } from "@/lib/supabase/client";
import { getPromotionStatus, type DiscountType, type PromotionStatus } from "@/lib/promotions";
import { assertRowAffected } from "@/lib/supabase/assert-write";

/**
 * Toda la comunicación con la tabla `promotions` vive acá -- mismo
 * criterio que `services/products.ts`/`categories.ts`. Sin borrado
 * restringido: a diferencia de `categories`/`products`, nada referencia
 * `promotions.id` como clave foránea (es al revés: una promoción apunta
 * OPCIONALMENTE a una categoría o un producto), así que eliminar una
 * promoción nunca puede romper integridad referencial de otra tabla.
 */

export type AdminPromotion = {
  id: string;
  title: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  categoryId: string | null;
  categoryName: string | null;
  productId: string | null;
  productName: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  status: PromotionStatus;
  createdAt: string;
};

export type PromotionFormInput = {
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  categoryId: string | null;
  productId: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

type PromotionRow = {
  id: string;
  title: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  category_id: string | null;
  product_id: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  categories: { name: string } | null;
  products: { name: string } | null;
};

const PROMOTION_SELECT = `
  id, title, description, discount_type, discount_value, category_id, product_id,
  starts_at, ends_at, is_active, created_at,
  categories ( name ),
  products ( name )
`;

function mapPromotionRow(row: PromotionRow): AdminPromotion {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    productId: row.product_id,
    productName: row.products?.name ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    status: getPromotionStatus({ isActive: row.is_active, startsAt: row.starts_at, endsAt: row.ends_at }),
    createdAt: row.created_at,
  };
}

export async function listPromotions(): Promise<AdminPromotion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("promotions")
    .select(PROMOTION_SELECT)
    .order("starts_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as PromotionRow[]).map(mapPromotionRow);
}

export async function getPromotionById(id: string): Promise<AdminPromotion | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("promotions")
    .select(PROMOTION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapPromotionRow(data as unknown as PromotionRow) : null;
}

function toRow(input: PromotionFormInput) {
  return {
    title: input.title,
    description: input.description.trim() ? input.description : null,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    category_id: input.categoryId,
    product_id: input.productId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    is_active: input.isActive,
  };
}

/** El chequeo de Postgres (`promotions_target_check`, `promotions_period_check`)
 * es la garantía final -- acá se mapea el mensaje crudo a algo legible en
 * vez de dejar pasar el texto interno del constraint. */
function rethrow(error: { code?: string; message: string }): never {
  if (error.code === "23514") {
    throw new Error(
      "Los datos no cumplen las reglas de la promoción (fechas o producto/categoría). Revisá el formulario."
    );
  }
  throw new Error(error.message);
}

export async function createPromotion(input: PromotionFormInput): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.from("promotions").insert(toRow(input)).select("id").single();

  if (error) rethrow(error);
  return data!.id as string;
}

export async function updatePromotion(id: string, input: PromotionFormInput): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("promotions")
    .update(toRow(input))
    .eq("id", id)
    .select("id");
  if (error) rethrow(error);
  assertRowAffected(
    data,
    "No se pudo actualizar la promoción: no tenés permisos de administrador o la promoción ya no existe."
  );
}

export async function deletePromotion(id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("promotions").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  assertRowAffected(
    data,
    "No se pudo eliminar la promoción: no tenés permisos de administrador o la promoción ya no existe."
  );
}
