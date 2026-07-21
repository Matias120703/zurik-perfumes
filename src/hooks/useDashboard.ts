"use client";

import { useCallback, useEffect, useState } from "react";

import { getDashboardData, type DashboardData } from "@/services/dashboard";

/** Más simple que el resto de los hooks del panel: el Dashboard no tiene
 * búsqueda, orden, filtro ni paginación -- es una sola pantalla de
 * lectura. Solo `fetch` + `refetch`. */
export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDashboardData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
