import type { OrderStatus } from "@/services/orders";

/**
 * Qué variante de Badge le corresponde a cada estado -- una decisión de
 * presentación, no de datos, mismo criterio que separa `category-icons.ts`
 * de `services/categories.ts` (Fase 13). `ORDER_STATUSES` (con las
 * etiquetas en español) sigue viviendo en `services/orders.ts`: es el
 * mismo array que ya necesitan los selectores de orden y filtro.
 */
const STATUS_VARIANTS: Record<OrderStatus, "outline" | "secondary" | "default" | "destructive"> = {
  pending: "outline",
  confirmed: "secondary",
  preparing: "secondary",
  ready_or_shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

export function getOrderStatusVariant(status: OrderStatus) {
  return STATUS_VARIANTS[status];
}
