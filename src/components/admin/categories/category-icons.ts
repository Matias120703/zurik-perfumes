import {
  BookOpen,
  Car,
  Dumbbell,
  Gamepad2,
  Gift,
  Home,
  Package,
  Palette,
  PawPrint,
  Shirt,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  Watch,
  type LucideIcon,
} from "lucide-react";

/**
 * Único lugar del proyecto que resuelve `categories.icon_name` (un texto,
 * ej. "smartphone") a un componente real de lucide-react -- por diseño
 * (Sprint 5.4), nunca se guarda un componente de React en la base de
 * datos, mismo criterio ya usado por `benefits.icon_name` (Fase 8). Vive
 * en `components/` (capa de presentación), no en `services/` ni `hooks/`:
 * ninguno de esos dos conoce lucide-react.
 */
export const CATEGORY_ICON_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "package", label: "Genérico", icon: Package },
  { value: "smartphone", label: "Tecnología", icon: Smartphone },
  { value: "home", label: "Hogar", icon: Home },
  { value: "sparkles", label: "Belleza", icon: Sparkles },
  { value: "dumbbell", label: "Deportes", icon: Dumbbell },
  { value: "gamepad-2", label: "Juguetes", icon: Gamepad2 },
  { value: "watch", label: "Accesorios", icon: Watch },
  { value: "shirt", label: "Ropa", icon: Shirt },
  { value: "utensils-crossed", label: "Alimentos", icon: UtensilsCrossed },
  { value: "gift", label: "Regalos", icon: Gift },
  { value: "car", label: "Automotor", icon: Car },
  { value: "paw-print", label: "Mascotas", icon: PawPrint },
  { value: "book-open", label: "Librería", icon: BookOpen },
  { value: "palette", label: "Arte y manualidades", icon: Palette },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((option) => [option.value, option.icon])
);

export function getCategoryIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? Package;
}
