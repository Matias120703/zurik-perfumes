import { createClient } from "@/lib/supabase/client";
import { assertRowAffected } from "@/lib/supabase/assert-write";
import {
  HOME_CONTENT_ID,
  HOME_CONTENT_SELECT,
  mapHomeContentRow,
  toHomeContentRow,
  type HomeContent,
  type HomeContentRow,
} from "@/lib/home-content";

/**
 * Toda la comunicación del panel con la fila única de `home_content`.
 * Mismo patrón que `services/settings.ts`: sólo lectura y actualización
 * (la fila la crea la migración, id = 1 fijo), nunca alta ni baja.
 *
 * El tipo del formulario es el mismo `HomeContent` que consume la tienda
 * pública (`lib/home-content.ts`) -- a diferencia de
 * Product/AdminProduct, acá no hay ni un campo que el panel vea y la
 * tienda no, así que un segundo tipo `AdminHomeContent` sería una copia
 * exacta sin ninguna diferencia que justificarla.
 */
export async function getHomeContent(): Promise<HomeContent> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("home_content")
    .select(HOME_CONTENT_SELECT)
    .eq("id", HOME_CONTENT_ID)
    .single();

  if (error) throw new Error(error.message);
  return mapHomeContentRow(data as unknown as HomeContentRow);
}

export async function updateHomeContent(input: HomeContent): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("home_content")
    .update(toHomeContentRow(input))
    .eq("id", HOME_CONTENT_ID)
    .select("id");

  if (error) throw new Error(error.message);

  /**
   * Sprint 6.3.1: un `update` bloqueado por RLS no devuelve error, sólo
   * cero filas afectadas -- sin este chequeo, el panel reportaría como
   * guardado un cambio que nunca se escribió.
   */
  assertRowAffected(
    data,
    "No se pudo guardar el contenido: no tenés permisos de administrador."
  );
}
