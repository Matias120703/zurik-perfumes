import { createClient } from "@/lib/supabase/client";
import { assertRowAffected } from "@/lib/supabase/assert-write";

/**
 * Toda la comunicación con la fila única de `business_settings` vive acá
 * -- mismo criterio que `services/products.ts`/`services/categories.ts`.
 * A diferencia de esas dos tablas, acá no hay alta ni baja (la fila la
 * crea el seed, id=1 fijo -- ver migración de la Fase 8): solo lectura y
 * actualización. También encapsula la subida/borrado de archivos del
 * bucket "branding" (logo/favicon), igual que `services/storage.ts` lo
 * hace para `product-images` -- ver CLAUDE.md sección 9 (Fase 14) para
 * por qué branding tiene su propio bucket en vez de reutilizar ese.
 */

const SETTINGS_ID = 1;
const BRANDING_BUCKET = "branding";

/**
 * Mismo límite configurado en el bucket "branding"
 * (`supabase/migrations/..._business_settings_admin_fields.sql`,
 * `file_size_limit = 2097152`). Bug 5 (Sprint 6.0.1): sin este chequeo del
 * lado del cliente, un logo/favicon que supera el límite recién se
 * enteraba al guardar -- Supabase Storage lo rechaza con "The object
 * exceeded the maximum allowed size", un 413 que `BrandingAssetField`
 * ahora valida ni bien se elige el archivo, antes de subir nada. Si el
 * límite del bucket cambia alguna vez, este valor tiene que actualizarse
 * junto con esa migración -- no hay forma de leer el límite del bucket
 * desde el cliente sin una consulta extra, y duplicar esta constante es
 * más simple que agregarla.
 */
export const MAX_BRANDING_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_BRANDING_FILE_SIZE_MB = 2;

export type AdminBusinessSettings = {
  storeName: string;
  tagline: string | null;
  storeDescription: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  whatsappProductInquiryTemplate: string;
  contactEmail: string | null;
  contactHours: string | null;
  contactAddress: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  currency: string;
  locale: string;
  mapCountry: string | null;
  mapCity: string | null;
  mapDefaultLat: number;
  mapDefaultLng: number;
  mapDefaultZoom: number;
};

/**
 * El formulario NO gestiona `currency`/`locale`: el sprint 5.5 no los
 * lista entre los campos editables de ninguna de las 5 secciones (a
 * diferencia de `ProductFormInput`, que sí excluye campos por ser de solo
 * lectura, acá se excluyen por estar fuera de alcance de este sprint --
 * `formatPrice()` sigue leyéndolos de `config/business.ts`, sin tocar,
 * porque cambiar su fuente afectaría a Carrito/Checkout, ver sección 9).
 */
export type SettingsFormInput = Omit<AdminBusinessSettings, "currency" | "locale">;

type SettingsRow = {
  store_name: string;
  tagline: string | null;
  store_description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  whatsapp_number: string;
  whatsapp_default_message: string;
  whatsapp_product_inquiry_template: string;
  contact_email: string | null;
  contact_hours: string | null;
  contact_address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  currency: string;
  locale: string;
  map_country: string | null;
  map_city: string | null;
  map_default_lat: number;
  map_default_lng: number;
  map_default_zoom: number;
};

const SETTINGS_SELECT = `
  store_name, tagline, store_description, logo_url, favicon_url,
  whatsapp_number, whatsapp_default_message, whatsapp_product_inquiry_template,
  contact_email, contact_hours, contact_address,
  instagram_url, facebook_url, tiktok_url,
  currency, locale, map_country, map_city, map_default_lat, map_default_lng, map_default_zoom
`;

function mapSettingsRow(row: SettingsRow): AdminBusinessSettings {
  return {
    storeName: row.store_name,
    tagline: row.tagline,
    storeDescription: row.store_description,
    logoUrl: row.logo_url,
    faviconUrl: row.favicon_url,
    whatsappNumber: row.whatsapp_number,
    whatsappDefaultMessage: row.whatsapp_default_message,
    whatsappProductInquiryTemplate: row.whatsapp_product_inquiry_template,
    contactEmail: row.contact_email,
    contactHours: row.contact_hours,
    contactAddress: row.contact_address,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    tiktokUrl: row.tiktok_url,
    currency: row.currency,
    locale: row.locale,
    mapCountry: row.map_country,
    mapCity: row.map_city,
    mapDefaultLat: Number(row.map_default_lat),
    mapDefaultLng: Number(row.map_default_lng),
    mapDefaultZoom: row.map_default_zoom,
  };
}

export async function getBusinessSettings(): Promise<AdminBusinessSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select(SETTINGS_SELECT)
    .eq("id", SETTINGS_ID)
    .single();

  if (error) throw new Error(error.message);
  return mapSettingsRow(data as unknown as SettingsRow);
}

/**
 * Solo `update` -- nunca `insert`/`delete`: la fila es única (id=1,
 * `constraint business_settings_singleton`) y la RLS de la Fase 8
 * (`business_settings_admin_update`) ni siquiera tiene policies de
 * insert/delete para el rol `authenticated`, a propósito.
 */
export async function updateBusinessSettings(input: SettingsFormInput): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("business_settings")
    .update({
      store_name: input.storeName,
      tagline: input.tagline,
      store_description: input.storeDescription,
      logo_url: input.logoUrl,
      favicon_url: input.faviconUrl,
      whatsapp_number: input.whatsappNumber,
      whatsapp_default_message: input.whatsappDefaultMessage,
      whatsapp_product_inquiry_template: input.whatsappProductInquiryTemplate,
      contact_email: input.contactEmail,
      contact_hours: input.contactHours,
      contact_address: input.contactAddress,
      instagram_url: input.instagramUrl,
      facebook_url: input.facebookUrl,
      tiktok_url: input.tiktokUrl,
      map_country: input.mapCountry,
      map_city: input.mapCity,
      map_default_lat: input.mapDefaultLat,
      map_default_lng: input.mapDefaultLng,
      map_default_zoom: input.mapDefaultZoom,
    })
    .eq("id", SETTINGS_ID)
    .select("id");

  if (error) throw new Error(error.message);
  assertRowAffected(data, "No se pudo guardar la configuración: no tenés permisos de administrador.");
}

/**
 * Mismo bug encontrado y corregido en el Sprint 6.3.2 que
 * `getStoragePathFromUrl`/`getCategoryImagePathFromUrl` (`services/storage.ts`):
 * `getPublicUrl()` arma la URL con `encodeURI()`, así que un logo/favicon
 * subido con un nombre de archivo con espacios u otros caracteres
 * especiales quedaba con esa parte todavía percent-encoded acá -- sin
 * `decodeURIComponent()`, `.remove([path])` buscaba un objeto con `%20`
 * literal en el nombre, no lo encontraba, y fallaba en silencio. Esta
 * función es la causa exacta del mensaje "No se pudo eliminar el archivo:
 * no tenés permisos de administrador." reportado en ese sprint -- el
 * archivo real seguía teniendo permisos correctos, la ruta que se le
 * pedía borrar a Storage simplemente no coincidía con ningún objeto real.
 */
function getBrandingPathFromUrl(url: string): string | null {
  const marker = `/object/public/${BRANDING_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

/**
 * Logo y favicon son archivos únicos (no una galería como product_images),
 * así que la ruta en el bucket es fija por tipo (`logo`/`favicon`) en vez
 * de llevar un id de producto -- reemplazar el logo sube un archivo nuevo
 * con el mismo nombre base (más un sufijo aleatorio para evitar caché de
 * CDN), y `updateBusinessSettings` es quien decide borrar el anterior.
 */
export async function uploadBrandingAsset(
  kind: "logo" | "favicon",
  file: File
): Promise<string> {
  const supabase = createClient();
  const path = `${kind}/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from(BRANDING_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Limpieza de Storage tras reemplazar/quitar el logo o favicon -- efecto
 * secundario de guardar Configuración, no la acción principal. Mismo
 * criterio que `deleteProductImageFiles`/`deleteCategoryImageFile`
 * (`services/storage.ts`, Sprint 6.3.2): un error real de Supabase se
 * propaga, pero una respuesta vacía (0 archivos coincidieron) no bloquea
 * el guardado de la configuración -- solo se registra para poder
 * diagnosticarlo. */
export async function deleteBrandingAsset(url: string): Promise<void> {
  const path = getBrandingPathFromUrl(url);
  if (!path) return;

  const supabase = createClient();
  const { data, error } = await supabase.storage.from(BRANDING_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    console.warn(
      "[deleteBrandingAsset] Storage no eliminó ningún archivo (ya no existía, o la ruta no coincide). No se bloquea el guardado de la configuración.",
      path
    );
  }
}
