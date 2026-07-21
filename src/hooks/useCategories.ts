"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { deleteCategory, listCategories, type AdminCategory } from "@/services/categories";

export type CategorySortValue =
  | "nombre-asc"
  | "nombre-desc"
  | "productos-desc"
  | "productos-asc"
  | "orden-asc"
  | "orden-desc";

export const CATEGORY_SORT_OPTIONS: { value: CategorySortValue; label: string }[] = [
  { value: "orden-asc", label: "Orden de visualización: primero el menor" },
  { value: "orden-desc", label: "Orden de visualización: primero el mayor" },
  { value: "nombre-asc", label: "Nombre: A-Z" },
  { value: "nombre-desc", label: "Nombre: Z-A" },
  { value: "productos-desc", label: "Cantidad de productos: mayor a menor" },
  { value: "productos-asc", label: "Cantidad de productos: menor a mayor" },
];

/**
 * Mismo criterio que useProducts.ts: orquesta /admin/categorias --
 * services/categories.ts trae los datos, acá se aplica búsqueda y orden en
 * memoria (un puñado de categorías, ningún catálogo grande que lo
 * justifique). A diferencia de useProducts.ts, sin paginación real
 * todavía -- el sprint pidió "preparar, sin implementar" (ver
 * CategoriesTable, que reserva el espacio en la UI sin recortar la lista).
 */
export function useCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CategorySortValue>("orden-asc");

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las categorías.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const visibleCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? categories.filter(
          (category) =>
            category.name.toLowerCase().includes(normalizedQuery) ||
            category.slug.toLowerCase().includes(normalizedQuery)
        )
      : categories;

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "nombre-asc":
          return a.name.localeCompare(b.name);
        case "nombre-desc":
          return b.name.localeCompare(a.name);
        case "productos-desc":
          return b.productCount - a.productCount;
        case "productos-asc":
          return a.productCount - b.productCount;
        case "orden-desc":
          return b.displayOrder - a.displayOrder;
        case "orden-asc":
        default:
          return a.displayOrder - b.displayOrder;
      }
    });
  }, [categories, query, sort]);

  async function removeCategory(category: AdminCategory) {
    setIsDeleting(true);
    try {
      await deleteCategory(category.id);
      await fetchCategories();
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    categories: visibleCategories,
    totalCount: categories.length,
    isLoading,
    isDeleting,
    error,
    query,
    setQuery,
    sort,
    setSort,
    refetch: fetchCategories,
    removeCategory,
  };
}
