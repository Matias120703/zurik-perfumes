import { createClient } from "@/lib/supabase/client";

/**
 * Lectura pública de `departments`/`cities`/`shipping_rates` para el
 * selector de envío del Checkout (Sprint 6.2). A diferencia del resto de
 * `services/storefront/*` (cliente de servidor, resuelto durante el render
 * de una página), este archivo usa el cliente de **browser** -- mismo
 * criterio que `services/storefront/orders.ts`: `/checkout` es "use client"
 * de punta a punta (depende de useCheckoutStore), así que nunca hay un
 * Server Component que necesite esta data por otra vía. Si algún sprint
 * futuro agrega un consumidor de servidor, la lección del Sprint 6.0.1
 * (bug 3) aplica: un archivo hermano nuevo, no una segunda función acá.
 */

export type PublicDepartment = { id: string; name: string };
export type PublicCity = { id: string; name: string };
export type PublicShippingRate = {
  id: string;
  name: string;
  price: number;
  estimatedDays: string | null;
};

export async function getPublicDepartments(): Promise<PublicDepartment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getPublicCitiesByDepartment(departmentId: string): Promise<PublicCity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, name")
    .eq("department_id", departmentId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

type ShippingRateCityRow = {
  shipping_rates: {
    id: string;
    name: string;
    price: number;
    estimated_days: string | null;
    created_at: string;
  } | null;
};

/**
 * Busca la tarifa vigente que cubre una ciudad -- null si ninguna tarifa
 * activa la incluye ("A confirmar" en el checkout, nunca un costo
 * inventado). El filtro `shipping_rates.is_active` se aplica de forma
 * explícita vía el `!inner` join, no solo confiando en RLS -- mismo
 * criterio que el bug 4 del Sprint 6.0.1 (una sesión de admin en el mismo
 * navegador vería tarifas inactivas también si no se repitiera acá).
 *
 * Si dos tarifas activas llegaran a cubrir la misma ciudad (no debería
 * pasar con el flujo normal del panel, que asigna un único departamento
 * por tarifa), gana la más reciente -- desempate resuelto en memoria
 * (`Array.sort`) en vez de un `.order()` sobre la tabla embebida, para no
 * depender de una sintaxis de PostgREST/supabase-js más frágil para un
 * caso que en la práctica no debería ocurrir.
 */
export async function getShippingRateForCity(cityId: string): Promise<PublicShippingRate | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shipping_rate_cities")
    .select("shipping_rates!inner ( id, name, price, estimated_days, is_active, created_at )")
    .eq("city_id", cityId)
    .eq("shipping_rates.is_active", true);

  if (error) throw new Error(error.message);

  const rates = (data as unknown as ShippingRateCityRow[])
    .map((row) => row.shipping_rates)
    .filter((rate): rate is NonNullable<ShippingRateCityRow["shipping_rates"]> => rate !== null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const rate = rates[0];
  if (!rate) return null;

  return {
    id: rate.id,
    name: rate.name,
    price: Number(rate.price),
    estimatedDays: rate.estimated_days,
  };
}
