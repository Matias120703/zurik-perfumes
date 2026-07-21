"use client";

import { useCallback, useEffect, useState } from "react";

import { getBusinessSettings, updateBusinessSettings, type SettingsFormInput } from "@/services/settings";

/**
 * Más simple que useProducts/useCategories: `business_settings` es una
 * fila única, sin búsqueda, sin orden, sin paginación ni borrado -- solo
 * "traer" y "guardar". `SettingsForm` es quien orquesta la subida/borrado
 * de logo y favicon en Storage antes de llamar a `save`.
 */
export function useSettings() {
  const [settings, setSettings] = useState<SettingsFormInput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBusinessSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la configuración.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function save(input: SettingsFormInput) {
    await updateBusinessSettings(input);
    setSettings(input);
  }

  return { settings, isLoading, error, refetch: fetchSettings, save };
}
