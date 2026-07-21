"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { getOrderStatusVariant } from "@/components/admin/orders/order-status";
import { formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUSES, type OrderStatus } from "@/services/orders";
import type { DashboardRecentOrder } from "@/services/dashboard";

const STATUS_LABEL = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s.label])) as Record<
  OrderStatus,
  string
>;

/** Reutiliza `getOrderStatusVariant` de components/admin/orders/ (import de
 * solo lectura -- "NO modificar Pedidos" se respeta). Cada fila linkea al
 * detalle real del pedido, sin tocar ningún archivo de ese módulo. */
export function RecentOrdersTable({ orders }: { orders: DashboardRecentOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay pedidos"
        description="Los últimos 10 pedidos de la tienda van a aparecer acá."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
            <th className="py-2 pr-4">N° Pedido</th>
            <th className="py-2 pr-4">Cliente</th>
            <th className="py-2 pr-4">Fecha</th>
            <th className="py-2 pr-4">Estado</th>
            <th className="py-2 pr-4">Total</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20">
              <td className="py-3 pr-4 font-medium text-foreground">#{order.orderNumber}</td>
              <td className="py-3 pr-4 text-foreground">{order.customerName}</td>
              <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                {formatDate(order.createdAt)}
              </td>
              <td className="py-3 pr-4">
                <Badge variant={getOrderStatusVariant(order.status)}>{STATUS_LABEL[order.status]}</Badge>
              </td>
              <td className="py-3 pr-4 font-medium text-foreground">{formatPrice(order.total)}</td>
              <td className="py-3 text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Ver pedido #${order.orderNumber}`}
                  nativeButton={false}
                  render={<Link href={`/admin/pedidos/${order.id}`} />}
                >
                  <Eye className="size-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
