"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listInventory, type AdminInventoryItem } from "@/services/inventory";

export type InventorySortValue =
  | "nombre-asc"
  | "nombre-desc"
  | "stock-asc"
  | "stock-desc"
  | "movimiento-desc"
  | "movimiento-asc";

export const INVENTORY_SORT_OPTIONS: { value: InventorySortValue; label: string }[] = [
  { value: "nombre-asc", label: "Nombre: A-Z" },
  { value: "nombre-desc", label: "Nombre: Z-A" },
  { value: "stock-asc", label: "Stock: menor a mayor" },
  { value: "stock-desc", label: "Stock: mayor a menor" },
  { value: "movimiento-desc", label: "Último movimiento: más reciente" },
  { value: "movimiento-asc", label: "Último movimiento: más antiguo" },
];

/** Mismo criterio que useProducts.ts/useOrders.ts/usePromotions.ts:
 * services/inventory.ts trae los datos, acá se aplica búsqueda + orden en
 * memoria. Paginación preparada pero no implementada -- mismo criterio ya
 * usado en Categorías/Pedidos/Clientes/Promociones. */
export function useInventory() {
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<InventorySortValue>("nombre-asc");

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listInventory();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el inventario.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (!normalizedQuery) return true;
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        (item.sku?.toLowerCase().includes(normalizedQuery) ?? false)
      );
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "nombre-desc":
          return b.name.localeCompare(a.name);
        case "stock-asc":
          return a.stock - b.stock;
        case "stock-desc":
          return b.stock - a.stock;
        case "movimiento-desc":
          return (b.lastMovementAt ?? "").localeCompare(a.lastMovementAt ?? "");
        case "movimiento-asc":
          return (a.lastMovementAt ?? "").localeCompare(b.lastMovementAt ?? "");
        case "nombre-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [items, query, sort]);

  return {
    items: visibleItems,
    totalCount: items.length,
    isLoading,
    error,
    query,
    setQuery,
    sort,
    setSort,
    refetch: fetchItems,
  };
}
