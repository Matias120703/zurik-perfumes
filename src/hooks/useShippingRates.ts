"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { deleteShippingRate, listShippingRates, type AdminShippingRate } from "@/services/logistics";

export type ShippingRateSortValue =
  | "nombre-asc"
  | "nombre-desc"
  | "precio-asc"
  | "precio-desc"
  | "ciudades-desc"
  | "ciudades-asc";

export const SHIPPING_RATE_SORT_OPTIONS: { value: ShippingRateSortValue; label: string }[] = [
  { value: "nombre-asc", label: "Nombre: A-Z" },
  { value: "nombre-desc", label: "Nombre: Z-A" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "ciudades-desc", label: "Cantidad de ciudades: mayor a menor" },
  { value: "ciudades-asc", label: "Cantidad de ciudades: menor a mayor" },
];

/**
 * Mismo criterio que useCategories.ts: orquesta /admin/logistica --
 * services/logistics.ts trae los datos, acá se aplica búsqueda y orden en
 * memoria. Sin paginación real todavía -- el sprint pidió "preparar, sin
 * implementar" (mismo patrón que Categorías/Pedidos/Promociones/Inventario).
 */
export function useShippingRates() {
  const [rates, setRates] = useState<AdminShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ShippingRateSortValue>("nombre-asc");

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listShippingRates();
      setRates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las tarifas de envío.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const visibleRates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? rates.filter((rate) => rate.name.toLowerCase().includes(normalizedQuery))
      : rates;

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "nombre-desc":
          return b.name.localeCompare(a.name);
        case "precio-asc":
          return a.price - b.price;
        case "precio-desc":
          return b.price - a.price;
        case "ciudades-desc":
          return b.cityCount - a.cityCount;
        case "ciudades-asc":
          return a.cityCount - b.cityCount;
        case "nombre-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [rates, query, sort]);

  async function removeRate(rate: AdminShippingRate) {
    setIsDeleting(true);
    try {
      await deleteShippingRate(rate.id);
      await fetchRates();
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    rates: visibleRates,
    totalCount: rates.length,
    isLoading,
    isDeleting,
    error,
    query,
    setQuery,
    sort,
    setSort,
    refetch: fetchRates,
    removeRate,
  };
}
