"use client";

import { useEffect, useState } from "react";

import { getCategoryById, type AdminCategory } from "@/services/categories";

/**
 * Mismo patrón que useProduct.ts: `id` vacío significa "modo creación, sin
 * nada que cargar" (CategoryForm llama a este hook incondicionalmente para
 * no romper las reglas de los hooks entre mode="create"/"edit").
 */
export function useCategory(id: string) {
  const [category, setCategory] = useState<AdminCategory | null>(null);
  const [isLoading, setIsLoading] = useState(id !== "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setCategory(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    (async () => {
      try {
        const data = await getCategoryById(id);
        if (active) setCategory(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "No se pudo cargar la categoría.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  return { category, isLoading, error };
}
