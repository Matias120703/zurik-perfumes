import { createClient } from "@/lib/supabase/server";
import {
  HOME_CONTENT_FALLBACK,
  HOME_CONTENT_ID,
  HOME_CONTENT_SELECT,
  mapHomeContentRow,
  type HomeContent,
  type HomeContentRow,
} from "@/lib/home-content";

/**
 * Lectura pública de la fila única de `home_content` -- mismo criterio
 * que `services/storefront/business.ts`: cliente de servidor, sin capa de
 * hooks (nada la fetchea del lado del cliente, la resuelve la Home y la
 * baja por props).
 *
 * A diferencia del resto de `services/storefront/*`, esta función NO
 * lanza si la lectura falla: devuelve `HOME_CONTENT_FALLBACK`. Es
 * contenido editorial (barra de anuncios, textos del hero, bloque
 * mayorista) -- que la Home entera devuelva un 500 porque una fila de
 * copy no está disponible sería peor que mostrar la tienda con las
 * secciones opcionales apagadas. Los productos, en cambio, sí siguen
 * lanzando: sin catálogo no hay tienda que mostrar.
 */
export async function getPublicHomeContent(): Promise<HomeContent> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_content")
    .select(HOME_CONTENT_SELECT)
    .eq("id", HOME_CONTENT_ID)
    .maybeSingle();

  if (error || !data) return HOME_CONTENT_FALLBACK;
  return mapHomeContentRow(data as unknown as HomeContentRow);
}
