"use client";

import { useCallback, useEffect, useState } from "react";

import type { HomeContent } from "@/lib/home-content";
import { getHomeContent, updateHomeContent } from "@/services/home-content";

/**
 * Mismo alcance que `useSettings`: `home_content` es una fila única, sin
 * búsqueda, orden, paginación ni borrado -- sólo "traer" y "guardar".
 */
export function useHomeContent() {
  const [content, setContent] = useState<HomeContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setContent(await getHomeContent());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar el contenido."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  async function save(input: HomeContent) {
    await updateHomeContent(input);
    /**
     * Actualización optimista con el mismo objeto que se acaba de
     * guardar, sin volver a leer -- mismo criterio que `useSettings`/
     * `useInventoryItem`: un refetch pondría `isLoading` en true y
     * remontaría el formulario entero, perdiendo el estado local.
     */
    setContent(input);
  }

  return { content, isLoading, error, refetch: fetchContent, save };
}
