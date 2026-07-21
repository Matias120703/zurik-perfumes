"use client";

import Link from "next/link";
import { Eye, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrderStatusSelect } from "@/components/admin/orders/OrderStatusSelect";
import { ORDER_SORT_OPTIONS, ORDER_STATUS_FILTER_OPTIONS, useOrders } from "@/hooks/useOrders";
import { formatDate, formatPrice } from "@/lib/utils";

const DELIVERY_METHOD_LABEL = { delivery: "Delivery", pickup: "Retiro en tienda" } as const;
const PAYMENT_METHOD_LABEL = { transfer: "Transferencia", cash: "Efectivo" } as const;

/** Mismo layout que ProductsTable/CategoriesTable: header + buscador +
 * filtro + orden + tabla + acciones. Sin paginación real todavía --
 * "preparar, sin implementar", mismo criterio que Categorías (Fase 13). */
export function OrdersTable() {
  const {
    orders,
    totalCount,
    isLoading,
    error,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    sort,
    setSort,
    refetch,
    changeOrderStatus,
  } = useOrders();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pedidos</h1>
        <p className="text-muted-foreground">
          Gestioná los pedidos realizados desde la tienda, conectados directamente a Supabase.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, teléfono o N° de pedido..."
            aria-label="Buscar pedido"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          items={ORDER_STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
        >
          <SelectTrigger aria-label="Filtrar por estado" className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select items={ORDER_SORT_OPTIONS} value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
          <SelectTrigger aria-label="Ordenar pedidos" className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Reintentar
          </Button>
        </div>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title={totalCount === 0 ? "Todavía no hay pedidos" : "No encontramos pedidos"}
          description={
            totalCount === 0
              ? "Los pedidos que los clientes hagan desde la tienda van a aparecer acá."
              : "Probá con otra búsqueda o cambiá el filtro de estado."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">N° Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Productos</th>
                  <th className="px-4 py-3">Entrega</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">#{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{order.customerName}</span>
                        <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3 text-foreground">{order.itemCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {DELIVERY_METHOD_LABEL[order.deliveryMethod]}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {PAYMENT_METHOD_LABEL[order.paymentMethod]}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusSelect
                        status={order.status}
                        onStatusChange={(status) => changeOrderStatus(order.id, status)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ver pedido #${order.orderNumber}`}
                          nativeButton={false}
                          render={<Link href={`/admin/pedidos/${order.id}`} />}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {totalCount} pedido{totalCount === 1 ? "" : "s"} en total
            </p>
            {/* Paginación preparada, no implementada todavía -- mismo
                criterio que /admin/categorias (Fase 13): el volumen de
                pedidos de una tienda chica no lo justifica todavía. */}
            <div className="mt-0" />
          </div>
        </>
      )}
    </div>
  );
}
