"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUSES, type OrderStatus } from "@/services/orders";

/**
 * Reutilizado en la tabla (cambio rápido, sin abrir el detalle) y en
 * `/admin/pedidos/[id]` -- un solo componente, una sola fuente de verdad
 * de qué estados existen (`ORDER_STATUSES`, services/orders.ts). El
 * cambio se refleja "inmediatamente" en Supabase (pedido del sprint) vía
 * `onStatusChange`, que en ambos consumidores termina llamando a
 * `updateOrderStatus` a través de `useOrder`/`useOrders`.
 */
export function OrderStatusSelect({
  status,
  onStatusChange,
  disabled,
}: {
  status: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      items={ORDER_STATUSES}
      value={status}
      onValueChange={(value) => onStatusChange(value as OrderStatus)}
      disabled={disabled}
    >
      <SelectTrigger aria-label="Cambiar estado del pedido" className="w-full sm:w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
