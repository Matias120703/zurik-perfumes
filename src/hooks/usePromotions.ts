"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { PromotionStatus } from "@/lib/promotions";
import { deletePromotion, listPromotions, type AdminPromotion } from "@/services/promotions";

export type PromotionSortValue =
  | "fecha-desc"
  | "fecha-asc"
  | "descuento-desc"
  | "descuento-asc"
  | "estado-asc"
  | "estado-desc";

export const PROMOTION_SORT_OPTIONS: { value: PromotionSortValue; label: string }[] = [
  { value: "fecha-desc", label: "Fecha de inicio: más recientes primero" },
  { value: "fecha-asc", label: "Fecha de inicio: más antiguas primero" },
  { value: "descuento-desc", label: "Descuento: mayor a menor" },
  { value: "descuento-asc", label: "Descuento: menor a mayor" },
  { value: "estado-asc", label: "Estado: activas primero" },
  { value: "estado-desc", label: "Estado: inactivas primero" },
];

const STATUS_RANK: Record<PromotionStatus, number> = {
  active: 0,
  scheduled: 1,
  expired: 2,
  inactive: 3,
};

/** Mismo criterio que useProducts.ts/useOrders.ts/useCustomers.ts:
 * services/promotions.ts trae los datos, acá se aplica búsqueda + orden
 * en memoria. Sin paginación real todavía -- "preparar, sin implementar",
 * mismo criterio que Categorías/Pedidos/Clientes. */
export function usePromotions() {
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PromotionSortValue>("fecha-desc");

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listPromotions();
      setPromotions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las promociones.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const visiblePromotions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? promotions.filter(
          (promotion) =>
            promotion.title.toLowerCase().includes(normalizedQuery) ||
            (promotion.categoryName ?? "").toLowerCase().includes(normalizedQuery) ||
            (promotion.productName ?? "").toLowerCase().includes(normalizedQuery)
        )
      : promotions;

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "fecha-asc":
          return a.startsAt.localeCompare(b.startsAt);
        case "descuento-desc":
          return b.discountValue - a.discountValue;
        case "descuento-asc":
          return a.discountValue - b.discountValue;
        case "estado-asc":
          return STATUS_RANK[a.status] - STATUS_RANK[b.status];
        case "estado-desc":
          return STATUS_RANK[b.status] - STATUS_RANK[a.status];
        case "fecha-desc":
        default:
          return b.startsAt.localeCompare(a.startsAt);
      }
    });
  }, [promotions, query, sort]);

  async function removePromotion(promotion: AdminPromotion) {
    setIsDeleting(true);
    try {
      await deletePromotion(promotion.id);
      await fetchPromotions();
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    promotions: visiblePromotions,
    totalCount: promotions.length,
    isLoading,
    isDeleting,
    error,
    query,
    setQuery,
    sort,
    setSort,
    refetch: fetchPromotions,
    removePromotion,
  };
}
