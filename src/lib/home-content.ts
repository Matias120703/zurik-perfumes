/**
 * Contrato compartido del contenido editorial de la Home
 * (tabla `home_content`, fila única id = 1).
 *
 * Por qué los tipos y el mapeo viven acá y no dentro de uno de los dos
 * servicios: `services/storefront/home-content.ts` importa
 * `lib/supabase/server.ts` (y con él `next/headers`), así que ningún
 * archivo que un Client Component vaya a importar puede colgar de él --
 * la lección documentada en CLAUDE.md (Sprint 6.0.1, bug 3). Como acá,
 * a diferencia de Product/AdminProduct, la forma del dato es idéntica
 * para el panel y para la tienda, en vez de duplicar el tipo en los dos
 * servicios se define una sola vez en `lib/` (sin ningún import de
 * Supabase) y ambos lo consumen -- mismo criterio que `lib/promotions.ts`
 * y `lib/sanitize-html.ts`, que también ejecutan de los dos lados.
 */

/** Un ítem de la sección "Garantías" (reemplazó a los testimonios). */
export type HomeGuarantee = {
  /**
   * Identificador de texto, resuelto a un ícono real sólo en la capa de
   * presentación (`components/storefront/guarantee-icons.ts`) -- mismo
   * criterio que `categories.icon_name`: la base nunca guarda un
   * componente de React.
   */
  icon: string;
  title: string;
  description: string;
};

export type HomeContent = {
  announcementEnabled: boolean;
  announcementMessages: string[];

  heroEyebrow: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroBadge: string | null;

  offersEnabled: boolean;
  offersEyebrow: string | null;
  offersTitle: string | null;
  offersSubtitle: string | null;

  wholesaleEnabled: boolean;
  wholesaleEyebrow: string | null;
  wholesaleTitle: string | null;
  wholesaleSubtitle: string | null;
  /** Link del grupo de WhatsApp. Vacío => el botón cae al chat directo. */
  wholesaleGroupUrl: string | null;
  wholesaleCtaLabel: string | null;
  wholesaleWhatsappMessage: string | null;
  wholesaleBenefits: string[];

  guaranteesEnabled: boolean;
  guaranteesEyebrow: string | null;
  guaranteesTitle: string | null;
  guaranteesSubtitle: string | null;
  guarantees: HomeGuarantee[];
};

export type HomeContentRow = {
  announcement_enabled: boolean;
  announcement_messages: unknown;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_badge: string | null;
  offers_enabled: boolean;
  offers_eyebrow: string | null;
  offers_title: string | null;
  offers_subtitle: string | null;
  wholesale_enabled: boolean;
  wholesale_eyebrow: string | null;
  wholesale_title: string | null;
  wholesale_subtitle: string | null;
  wholesale_group_url: string | null;
  wholesale_cta_label: string | null;
  wholesale_whatsapp_message: string | null;
  wholesale_benefits: unknown;
  guarantees_enabled: boolean;
  guarantees_eyebrow: string | null;
  guarantees_title: string | null;
  guarantees_subtitle: string | null;
  guarantees: unknown;
};

export const HOME_CONTENT_SELECT = `
  announcement_enabled, announcement_messages,
  hero_eyebrow, hero_title, hero_subtitle, hero_badge,
  offers_enabled, offers_eyebrow, offers_title, offers_subtitle,
  wholesale_enabled, wholesale_eyebrow, wholesale_title, wholesale_subtitle,
  wholesale_group_url, wholesale_cta_label, wholesale_whatsapp_message, wholesale_benefits,
  guarantees_enabled, guarantees_eyebrow, guarantees_title, guarantees_subtitle, guarantees
`;

export const HOME_CONTENT_ID = 1;

/** jsonb llega como `unknown` -- se valida acá en vez de castear a ciegas. */
function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim() !== ""
  );
}

function parseGuarantees(value: unknown): HomeGuarantee[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Record<string, unknown>;
    const title = typeof candidate.title === "string" ? candidate.title : "";
    if (!title.trim()) return [];
    return [
      {
        icon: typeof candidate.icon === "string" ? candidate.icon : "badge-check",
        title,
        description:
          typeof candidate.description === "string" ? candidate.description : "",
      },
    ];
  });
}

export function mapHomeContentRow(row: HomeContentRow): HomeContent {
  return {
    announcementEnabled: row.announcement_enabled,
    announcementMessages: parseStringArray(row.announcement_messages),
    heroEyebrow: row.hero_eyebrow,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    heroBadge: row.hero_badge,
    offersEnabled: row.offers_enabled,
    offersEyebrow: row.offers_eyebrow,
    offersTitle: row.offers_title,
    offersSubtitle: row.offers_subtitle,
    wholesaleEnabled: row.wholesale_enabled,
    wholesaleEyebrow: row.wholesale_eyebrow,
    wholesaleTitle: row.wholesale_title,
    wholesaleSubtitle: row.wholesale_subtitle,
    wholesaleGroupUrl: row.wholesale_group_url,
    wholesaleCtaLabel: row.wholesale_cta_label,
    wholesaleWhatsappMessage: row.wholesale_whatsapp_message,
    wholesaleBenefits: parseStringArray(row.wholesale_benefits),
    guaranteesEnabled: row.guarantees_enabled,
    guaranteesEyebrow: row.guarantees_eyebrow,
    guaranteesTitle: row.guarantees_title,
    guaranteesSubtitle: row.guarantees_subtitle,
    guarantees: parseGuarantees(row.guarantees),
  };
}

export function toHomeContentRow(input: HomeContent) {
  return {
    announcement_enabled: input.announcementEnabled,
    announcement_messages: input.announcementMessages,
    hero_eyebrow: input.heroEyebrow,
    hero_title: input.heroTitle,
    hero_subtitle: input.heroSubtitle,
    hero_badge: input.heroBadge,
    offers_enabled: input.offersEnabled,
    offers_eyebrow: input.offersEyebrow,
    offers_title: input.offersTitle,
    offers_subtitle: input.offersSubtitle,
    wholesale_enabled: input.wholesaleEnabled,
    wholesale_eyebrow: input.wholesaleEyebrow,
    wholesale_title: input.wholesaleTitle,
    wholesale_subtitle: input.wholesaleSubtitle,
    wholesale_group_url: input.wholesaleGroupUrl,
    wholesale_cta_label: input.wholesaleCtaLabel,
    wholesale_whatsapp_message: input.wholesaleWhatsappMessage,
    wholesale_benefits: input.wholesaleBenefits,
    guarantees_enabled: input.guaranteesEnabled,
    guarantees_eyebrow: input.guaranteesEyebrow,
    guarantees_title: input.guaranteesTitle,
    guarantees_subtitle: input.guaranteesSubtitle,
    guarantees: input.guarantees,
  };
}

/**
 * Usado sólo si la fila no existe o la lectura falla: la tienda pública
 * nunca debe caerse por un problema de contenido editorial. Sin la fila,
 * la Home muestra sus secciones con estos valores en vez de un error.
 */
export const HOME_CONTENT_FALLBACK: HomeContent = {
  announcementEnabled: false,
  announcementMessages: [],
  heroEyebrow: null,
  heroTitle: null,
  heroSubtitle: null,
  heroBadge: null,
  offersEnabled: true,
  offersEyebrow: "Ofertas",
  offersTitle: "Ofertas de la semana",
  offersSubtitle: null,
  wholesaleEnabled: false,
  wholesaleEyebrow: null,
  wholesaleTitle: null,
  wholesaleSubtitle: null,
  wholesaleGroupUrl: null,
  wholesaleCtaLabel: null,
  wholesaleWhatsappMessage: null,
  wholesaleBenefits: [],
  guaranteesEnabled: false,
  guaranteesEyebrow: null,
  guaranteesTitle: null,
  guaranteesSubtitle: null,
  guarantees: [],
};

/**
 * Decide a dónde apunta el botón del bloque mayorista. Función pura y
 * compartida (la usan el bloque de la Home, el Header y el menú mobile)
 * para que ninguno arme esa URL por su cuenta: si hay link de grupo
 * cargado, va al grupo; si no, al chat directo del negocio con el mensaje
 * ya escrito. Nunca devuelve un botón sin destino.
 */
export function getWholesaleHref({
  groupUrl,
  whatsappNumber,
  message,
}: {
  groupUrl: string | null;
  whatsappNumber: string;
  message: string | null;
}): string {
  const trimmed = groupUrl?.trim();
  if (trimmed) return trimmed;

  const text = message?.trim() || "Hola! Quiero sumarme al grupo mayorista.";
  return "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(text);
}
