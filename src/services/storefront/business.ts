import { createClient } from "@/lib/supabase/server";

/**
 * Lectura pública de la fila única de `business_settings` (Sprint 5.5) --
 * mismo criterio que `services/storefront/products.ts`/`categories.ts`:
 * cliente de servidor, sin capa de hooks (nada la fetchea del lado del
 * cliente). A diferencia de `Product`/`Category`, no hay un tipo previo en
 * `config/business.ts` para reutilizar (`businessConfig` nunca exportó un
 * `type`) -- `BusinessSettings` se define acá, como el nuevo contrato.
 *
 * RLS (`business_settings_public_read`, sin filtro) ya permite leer la
 * fila completa sin sesión -- no hay ninguna columna sensible en esta
 * tabla (Fase 8).
 */

export type BusinessSettings = {
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

type BusinessSettingsRow = {
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

const BUSINESS_SETTINGS_SELECT = `
  store_name, tagline, store_description, logo_url, favicon_url,
  whatsapp_number, whatsapp_default_message, whatsapp_product_inquiry_template,
  contact_email, contact_hours, contact_address,
  instagram_url, facebook_url, tiktok_url,
  currency, locale, map_country, map_city, map_default_lat, map_default_lng, map_default_zoom
`;

function mapBusinessSettingsRow(row: BusinessSettingsRow): BusinessSettings {
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

export async function getPublicBusinessSettings(): Promise<BusinessSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select(BUSINESS_SETTINGS_SELECT)
    .eq("id", 1)
    .single();

  if (error) throw new Error(error.message);
  return mapBusinessSettingsRow(data as unknown as BusinessSettingsRow);
}
