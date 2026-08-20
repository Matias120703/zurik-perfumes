"use client";

import { useCallback, useEffect, useState } from "react";

import type { PaymentMethod } from "@/lib/payment-methods";
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
  type PaymentMethodInput,
} from "@/services/payment-methods";

/**
 * Sin búsqueda, orden ni paginación: son unos pocos métodos de pago, no
 * un catálogo. Cada operación actualiza el estado local con lo que ya
 * devolvió la escritura, sin refetch -- mismo criterio que
 * `useInventoryItem` (un refetch pondría `isLoading` en true y
 * remontaría el formulario que el admin está usando).
 */
export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setMethods(await listPaymentMethods());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los métodos de pago."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  async function create(input: PaymentMethodInput) {
    const created = await createPaymentMethod(input);
    setMethods((current) => [...current, created]);
  }

  async function update(id: string, input: PaymentMethodInput) {
    await updatePaymentMethod(id, input);
    setMethods((current) =>
      current.map((method) =>
        method.id === id
          ? {
              ...method,
              name: input.name.trim(),
              instructions: input.instructions?.trim() || null,
              isActive: input.isActive,
              displayOrder: input.displayOrder,
            }
          : method
      )
    );
  }

  async function remove(id: string) {
    await deletePaymentMethod(id);
    setMethods((current) => current.filter((method) => method.id !== id));
  }

  return { methods, isLoading, error, refetch: fetchMethods, create, update, remove };
}
