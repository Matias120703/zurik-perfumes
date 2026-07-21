"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listOrders,
  updateOrderStatus,
  ORDER_STATUSES,
  type AdminOrder,
  type OrderStatus,
} from "@/services/orders";

export type OrderSortValue =
  | "fecha-desc"
  | "fecha-asc"
  | "total-desc"
  | "total-asc"
  | "estado-asc"
  | "estado-desc";

export const ORDER_SORT_OPTIONS: { value: OrderSortValue; label: string }[] = [
  { value: "fecha-desc", label: "Fecha: más recientes primero" },
  { value: "fecha-asc", label: "Fecha: más antiguos primero" },
  { value: "total-desc", label: "Total: mayor a menor" },
  { value: "total-asc", label: "Total: menor a mayor" },
  { value: "estado-asc", label: "Estado: pendiente primero" },
  { value: "estado-desc", label: "Estado: entregado primero" },
];

export const ORDER_STATUS_FILTER_OPTIONS: { value: OrderStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  ...ORDER_STATUSES,
];

const STATUS_ORDER: Record<OrderStatus, number> = Object.fromEntries(
  ORDER_STATUSES.map((option, index) => [option.value, index])
) as Record<OrderStatus, number>;

/**
 * Mismo criterio que useProducts.ts/useCategories.ts: services/orders.ts
 * trae los datos, acá se aplica búsqueda + filtro de estado + orden en
 * memoria. Sin paginación real todavía -- "preparar, sin implementar"
 * (mismo criterio que ya usó Categorías, Fase 13).
 */
export function useOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "todos">("todos");
  const [sort, setSort] = useState<OrderSortValue>("fecha-desc");

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los pedidos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      if (statusFilter !== "todos" && order.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return (
        order.customerName.toLowerCase().includes(normalizedQuery) ||
        order.customerPhone.toLowerCase().includes(normalizedQuery) ||
        String(order.orderNumber).includes(normalizedQuery)
      );
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "fecha-asc":
          return a.createdAt.localeCompare(b.createdAt);
        case "total-desc":
          return b.total - a.total;
        case "total-asc":
          return a.total - b.total;
        case "estado-asc":
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        case "estado-desc":
          return STATUS_ORDER[b.status] - STATUS_ORDER[a.status];
        case "fecha-desc":
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [orders, query, statusFilter, sort]);

  /** Cambio rápido desde la tabla, sin abrir el detalle -- optimista,
   * revertido si Supabase rechaza el update (mismo criterio que useOrder.ts). */
  async function changeOrderStatus(orderId: string, status: OrderStatus) {
    const previous = orders;
    setOrders((current) => current.map((o) => (o.id === orderId ? { ...o, status } : o)));
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      setOrders(previous);
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado.");
    }
  }

  return {
    orders: visibleOrders,
    totalCount: orders.length,
    changeOrderStatus,
    isLoading,
    error,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    sort,
    setSort,
    refetch: fetchOrders,
  };
}
