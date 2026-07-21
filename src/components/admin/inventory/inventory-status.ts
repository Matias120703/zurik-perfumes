import type { InventoryStatus, MovementType } from "@/services/inventory";

/**
 * Qué variante de Badge le corresponde a cada estado de inventario y a
 * cada tipo de movimiento -- decisión de presentación, no de datos, mismo
 * criterio que `order-status.ts`/`promotion-status.ts` (las etiquetas en
 * español viven en `services/inventory.ts`, junto a los datos).
 */
const STATUS_LABEL: Record<InventoryStatus, string> = {
  out_of_stock: "Sin stock",
  low_stock: "Stock bajo",
  normal: "Normal",
};

const STATUS_VARIANT: Record<InventoryStatus, "outline" | "secondary" | "default" | "destructive"> = {
  out_of_stock: "destructive",
  low_stock: "secondary",
  normal: "default",
};

export function getInventoryStatusLabel(status: InventoryStatus): string {
  return STATUS_LABEL[status];
}

export function getInventoryStatusVariant(status: InventoryStatus) {
  return STATUS_VARIANT[status];
}

const MOVEMENT_TYPE_VARIANT: Record<MovementType, "outline" | "secondary" | "default" | "destructive"> = {
  manual_in: "default",
  manual_adjustment: "secondary",
  order_confirmed: "outline",
  order_cancelled: "destructive",
};

export function getMovementTypeVariant(type: MovementType) {
  return MOVEMENT_TYPE_VARIANT[type];
}
