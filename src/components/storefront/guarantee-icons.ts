import {
  BadgeCheck,
  Clock,
  Gem,
  HandCoins,
  Headphones,
  Heart,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Único lugar del proyecto que traduce el `icon` de texto guardado en
 * `home_content.guarantees` a un componente real de lucide-react.
 *
 * Mismo criterio que `components/admin/categories/category-icons.ts` y
 * que `benefits.icon_name` (Fase 8): la base guarda un identificador, no
 * un componente de React, y la resolución vive en la capa de
 * presentación -- `services/` y `lib/` no conocen lucide-react.
 */
export const GUARANTEE_ICONS: Record<string, LucideIcon> = {
  "badge-check": BadgeCheck,
  "shield-check": ShieldCheck,
  truck: Truck,
  "message-circle": MessageCircle,
  "hand-coins": HandCoins,
  headphones: Headphones,
  sparkles: Sparkles,
  gem: Gem,
  star: Star,
  heart: Heart,
  package: Package,
  clock: Clock,
  wallet: Wallet,
};

/** Lista para el selector del panel (/admin/contenido). */
export const GUARANTEE_ICON_OPTIONS = Object.keys(GUARANTEE_ICONS);

export function getGuaranteeIcon(name: string): LucideIcon {
  return GUARANTEE_ICONS[name] ?? BadgeCheck;
}
