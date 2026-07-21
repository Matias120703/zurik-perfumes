"use client";

import { useCallback, useEffect, useState } from "react";

import { getCustomerById, type AdminCustomerDetail } from "@/services/customers";

/** Mismo patrón que useProduct.ts/useCategory.ts/useOrder.ts, para
 * /admin/clientes/[id]. Sin acción de cambio de estado ni de guardado:
 * el módulo de Clientes es de solo lectura. */
export function useCustomer(id: string) {
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomerById(id);
      setCustomer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el cliente.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return { customer, isLoading, error, refetch: fetchCustomer };
}
