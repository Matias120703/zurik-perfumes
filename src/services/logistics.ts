import { createClient } from "@/lib/supabase/client";
import { assertRowAffected } from "@/lib/supabase/assert-write";

/**
 * Toda la comunicación con `shipping_rates`/`shipping_rate_cities` (y la
 * lectura de `departments`/`cities` que necesita el formulario) vive acá --
 * mismo criterio que `services/categories.ts`/`services/products.ts`:
 * ningún componente ni hook arma una query de Supabase por su cuenta.
 *
 * `departments`/`cities` son de solo lectura desde toda la aplicación (Sprint
 * 6.2): no hay `createDepartment`/`createCity` acá ni en ningún otro lugar --
 * se cargan una única vez con `supabase/seed_logistics.sql`.
 */

export type AdminDepartment = { id: string; name: string };
export type AdminCity = { id: string; name: string; departmentId: string };

export type AdminShippingRate = {
  id: string;
  name: string;
  price: number;
  estimatedDays: string | null;
  isActive: boolean;
  cityCount: number;
  createdAt: string;
};

export type AdminShippingRateDetail = AdminShippingRate & {
  cityIds: string[];
};

export type ShippingRateFormInput = {
  name: string;
  price: number;
  estimatedDays: string;
  isActive: boolean;
  cityIds: string[];
};

export async function listDepartments(): Promise<AdminDepartment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function listCitiesByDepartment(departmentId: string): Promise<AdminCity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, department_id")
    .eq("department_id", departmentId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data.map((row) => ({ id: row.id, name: row.name, departmentId: row.department_id }));
}

/** Usada por ShippingRateForm en modo edición para saber a qué departamento
 * preseleccionar: todas las ciudades ya asignadas a una tarifa comparten el
 * mismo departamento (restricción de UI de DepartmentCityPicker, no de la
 * base), así que alcanza con mirar el departamento de cualquiera de ellas. */
export async function getCitiesByIds(ids: string[]): Promise<AdminCity[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, department_id")
    .in("id", ids);

  if (error) throw new Error(error.message);
  return data.map((row) => ({ id: row.id, name: row.name, departmentId: row.department_id }));
}

type ShippingRateRow = {
  id: string;
  name: string;
  price: number;
  estimated_days: string | null;
  is_active: boolean;
  created_at: string;
  city_count: { count: number }[] | null;
};

// `city_count` es un alias de PostgREST sobre el mismo embed
// (`shipping_rate_cities ( count )`) -- necesario porque
// `getShippingRateById` pide el conteo Y la lista de city_id en la misma
// consulta; sin alias, dos embeds de la misma tabla en un solo `select`
// chocan entre sí.
const SHIPPING_RATE_SELECT = `
  id, name, price, estimated_days, is_active, created_at,
  city_count:shipping_rate_cities ( count )
`;

function mapShippingRateRow(row: ShippingRateRow): AdminShippingRate {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    estimatedDays: row.estimated_days,
    isActive: row.is_active,
    cityCount: row.city_count?.[0]?.count ?? 0,
    createdAt: row.created_at,
  };
}

export async function listShippingRates(): Promise<AdminShippingRate[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .select(SHIPPING_RATE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as ShippingRateRow[]).map(mapShippingRateRow);
}

export async function getShippingRateById(id: string): Promise<AdminShippingRateDetail | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .select(`${SHIPPING_RATE_SELECT}, assigned_cities:shipping_rate_cities ( city_id )`)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as unknown as ShippingRateRow & { assigned_cities: { city_id: string }[] };
  return {
    ...mapShippingRateRow(row),
    cityIds: row.assigned_cities.map((r) => r.city_id),
  };
}

function toRow(input: ShippingRateFormInput) {
  return {
    name: input.name,
    price: input.price,
    estimated_days: input.estimatedDays.trim() ? input.estimatedDays.trim() : null,
    is_active: input.isActive,
  };
}

/** Reemplaza por completo las ciudades asignadas a una tarifa: borra todas
 * las filas existentes y vuelve a insertar el set actual -- más simple y
 * correcto que diffear alta/baja, con el volumen de ciudades de una sola
 * tarifa (decenas, nunca miles) no hay ninguna necesidad de optimizarlo. */
async function replaceShippingRateCities(rateId: string, cityIds: string[]): Promise<void> {
  const supabase = createClient();

  const { error: deleteError } = await supabase
    .from("shipping_rate_cities")
    .delete()
    .eq("shipping_rate_id", rateId);
  if (deleteError) throw new Error(deleteError.message);

  if (cityIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("shipping_rate_cities")
    .insert(cityIds.map((cityId) => ({ shipping_rate_id: rateId, city_id: cityId })));
  if (insertError) throw new Error(insertError.message);
}

/** Mismo patrón que products+product_images (services/products.ts): dos
 * escrituras secuenciales desde el cliente, sin RPC -- quien invoca ya es
 * un admin autenticado, no hace falta bypasear RLS ni garantizar atomicidad
 * cross-tabla (a diferencia de create_order, invocada por anon). */
export async function createShippingRate(input: ShippingRateFormInput): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .insert(toRow(input))
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await replaceShippingRateCities(data.id as string, input.cityIds);
  return data.id as string;
}

export async function updateShippingRate(id: string, input: ShippingRateFormInput): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .update(toRow(input))
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  assertRowAffected(
    data,
    "No se pudo actualizar la tarifa de envío: no tenés permisos de administrador o la tarifa ya no existe."
  );
  await replaceShippingRateCities(id, input.cityIds);
}

/** Sin bloqueo de integridad referencial que chequear (a diferencia de
 * deleteCategory): `orders.shipping_rate_id` es `on delete set null`, así
 * que un pedido viejo no impide borrar la tarifa que usó -- se apoya en
 * `orders.shipping_rate_name` (snapshot) para seguir siendo legible. */
export async function deleteShippingRate(id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("shipping_rates").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  assertRowAffected(
    data,
    "No se pudo eliminar la tarifa de envío: no tenés permisos de administrador o la tarifa ya no existe."
  );
}
