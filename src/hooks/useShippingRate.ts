"use client";

import { useEffect, useState } from "react";

import { getShippingRateById, type AdminShippingRateDetail } from "@/services/logistics";

/**
 * Mismo patrón que useCategory.ts: `id` vacío significa "modo creación, sin
 * nada que cargar" (ShippingRateForm llama a este hook incondicionalmente
 * para no romper las reglas de los hooks entre mode="create"/"edit").
 */
export function useShippingRate(id: string) {
  const [rate, setRate] = useState<AdminShippingRateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(id !== "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setRate(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    (async () => {
      try {
        const data = await getShippingRateById(id);
        if (active) setRate(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "No se pudo cargar la tarifa de envío.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  return { rate, isLoading, error };
}
