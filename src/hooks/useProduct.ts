"use client";

import { useEffect, useState } from "react";

import { getProductById, type AdminProduct } from "@/services/products";

/**
 * `id` vacío significa "modo creación, sin nada que cargar" (ProductForm
 * llama a este hook incondicionalmente para no romper las reglas de los
 * hooks entre mode="create"/"edit") -- no dispara ninguna consulta a
 * Supabase en ese caso, en vez de mandar un id=eq."" que Postgres rechaza
 * (uuid inválido).
 */
export function useProduct(id: string) {
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [isLoading, setIsLoading] = useState(id !== "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    (async () => {
      try {
        const data = await getProductById(id);
        if (active) setProduct(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el producto.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  return { product, isLoading, error };
}
