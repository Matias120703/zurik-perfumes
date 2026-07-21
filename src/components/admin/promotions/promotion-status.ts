import type { PromotionStatus } from "@/lib/promotions";

/** Qué variante de Badge y qué etiqueta le corresponde a cada estado
 * calculado -- capa de presentación, mismo criterio que
 * components/admin/orders/order-status.ts. */
const STATUS_LABEL: Record<PromotionStatus, string> = {
  active: "Activa",
  scheduled: "Programada",
  expired: "Vencida",
  inactive: "Inactiva",
};

const STATUS_VARIANT: Record<PromotionStatus, "outline" | "secondary" | "default" | "destructive"> = {
  active: "default",
  scheduled: "secondary",
  expired: "outline",
  inactive: "destructive",
};

export function getPromotionStatusLabel(status: PromotionStatus) {
  return STATUS_LABEL[status];
}

export function getPromotionStatusVariant(status: PromotionStatus) {
  return STATUS_VARIANT[status];
}
