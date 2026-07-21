"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { deleteProduct, listProducts, type AdminProduct } from "@/services/products";
import { deleteProductImageFiles } from "@/services/storage";

export type ProductSortValue =
  | "nombre-asc"
  | "nombre-desc"
  | "precio-asc"
  | "precio-desc"
  | "stock-asc"
  | "stock-desc";

export const PRODUCT_SORT_OPTIONS: { value: ProductSortValue; label: string }[] = [
  { value: "nombre-asc", label: "Nombre: A-Z" },
  { value: "nombre-desc", label: "Nombre: Z-A" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "stock-asc", label: "Stock: menor a mayor" },
  { value: "stock-desc", label: "Stock: mayor a menor" },
];

const PAGE_SIZE = 10;

/**
 * Orquesta el listado de productos para /admin/productos: trae los datos
 * de services/products.ts, y aplica búsqueda/orden/paginación en memoria
 * (mismo criterio que el pipeline del catálogo público -- categoría/
 * búsqueda/orden en lib/search.ts y lib/sort.ts -- pero acá vive en el
 * hook, sin archivos propios todavía: es un solo módulo, no tres, y
 * extraerlos ahora sería sobreingeniería para un listado de un puñado de
 * productos). Borrar un producto también limpia sus imágenes de Storage
 * antes de borrar la fila -- si no, quedarían archivos huérfanos en el
 * bucket.
 */
export function useProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [query, setQueryState] = useState("");
  const [sort, setSortState] = useState<ProductSortValue>("nombre-asc");
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los productos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? products.filter(
          (product) =>
            product.name.toLowerCase().includes(normalizedQuery) ||
            (product.categoryName ?? "").toLowerCase().includes(normalizedQuery)
        )
      : products;

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "nombre-asc":
          return a.name.localeCompare(b.name);
        case "nombre-desc":
          return b.name.localeCompare(a.name);
        case "precio-asc":
          return a.price - b.price;
        case "precio-desc":
          return b.price - a.price;
        case "stock-asc":
          return a.stock - b.stock;
        case "stock-desc":
          return b.stock - a.stock;
        default:
          return 0;
      }
    });
  }, [products, query, sort]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = visibleProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function setQuery(value: string) {
    setQueryState(value);
    setPage(1);
  }

  function setSort(value: ProductSortValue) {
    setSortState(value);
    setPage(1);
  }

  async function removeProduct(product: AdminProduct) {
    setIsDeleting(true);
    try {
      if (product.images.length > 0) {
        await deleteProductImageFiles(product.images.map((image) => image.url));
      }
      await deleteProduct(product.id);
      await fetchProducts();
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    products: paginatedProducts,
    totalCount: visibleProducts.length,
    isLoading,
    isDeleting,
    error,
    query,
    setQuery,
    sort,
    setSort,
    page: currentPage,
    totalPages,
    setPage,
    refetch: fetchProducts,
    removeProduct,
  };
}
