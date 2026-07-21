"use client";

import { useEffect, useState } from "react";

import { getPromotionById, type AdminPromotion } from "@/services/promotions";

/**
 * `id` vacío significa "modo creación, sin nada que cargar" -- mismo
 * patrón que useProduct.ts/useCategory.ts (PromotionForm llama a este
 * hook incondicionalmente para no romper las reglas de los hooks entre
 * mode="create"/"edit").
 */
export function usePromotion(id: string) {
  const [promotion, setPromotion] = useState<AdminPromotion | null>(null);
  const [isLoading, setIsLoading] = useState(id !== "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setPromotion(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    (async () => {
      try {
        const data = await getPromotionById(id);
        if (active) setPromotion(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "No se pudo cargar la promoción.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  return { promotion, isLoading, error };
}
