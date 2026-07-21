"use client";

import { useCallback, useEffect, useState } from "react";

import { getOrderById, updateOrderStatus, type AdminOrder, type OrderStatus } from "@/services/orders";

/** Mismo patrón que useProduct.ts/useCategory.ts, para /admin/pedidos/[id]. */
export function useOrder(id: string) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el pedido.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /** El cambio de estado se refleja al toque en la UI (estado optimista)
   * y se confirma contra Supabase -- si falla, se revierte y se muestra
   * el error, sin dejar la pantalla mostrando un estado que no se guardó. */
  async function changeStatus(status: OrderStatus) {
    if (!order) return;
    const previousStatus = order.status;
    setOrder({ ...order, status });
    setIsUpdatingStatus(true);
    try {
      await updateOrderStatus(order.id, status);
    } catch (err) {
      setOrder((current) => (current ? { ...current, status: previousStatus } : current));
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return { order, isLoading, error, isUpdatingStatus, changeStatus, refetch: fetchOrder };
}
