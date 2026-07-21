import { createClient } from "@/lib/supabase/client";
import type { BusinessSettings } from "@/services/storefront/business";

/**
 * Misma fila, mismo mapeo que `getPublicBusinessSettings()`
 * (`services/storefront/business.ts`), pero con el cliente de **browser**
 * -- para `/checkout/confirmacion` (Sprint 6.0.1, bug 3), la única página
 * de la tienda pública que es "use client" de punta a punta porque
 * depende de useCartStore/useCheckoutStore (estado que solo existe en el
 * navegador, no se puede resolver en un Server Component). Mismo criterio
 * ya usado en `services/storefront/orders.ts` (Fase 15): cliente de
 * servidor cuando el render ocurre en el servidor, de browser cuando no
 * hay otra opción real.
 *
 * Vive en su **propio archivo**, no como una segunda función dentro de
 * `business.ts` -- ese archivo importa `lib/supabase/server.ts`, que a su
 * vez importa `next/headers` (una Dynamic API exclusiva de Server
 * Components). La primera versión de este fix agregó la función acá
 * mismo, en `business.ts`, y rompió el build: en cuanto un Client
 * Component (`OrderConfirmationDetails.tsx`) importó algo de ese archivo,
 * Next.js intentó incluir `next/headers` en el bundle del navegador y
 * falló ("You're importing a component that needs 'next/headers'...").
 * Solo el `type BusinessSettings` (import type, se borra en tiempo de
 * compilación) es seguro de compartir entre ambos archivos -- el resto
 * (la consulta en sí) se duplica acá a propósito, mínimo y autocontenido,
 * en vez de forzar una dependencia server->client inexistente.
 */

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

export async function getPublicBusinessSettingsClient(): Promise<BusinessSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select(BUSINESS_SETTINGS_SELECT)
    .eq("id", 1)
    .single();

  if (error) throw new Error(error.message);
  return mapBusinessSettingsRow(data as unknown as BusinessSettingsRow);
}
