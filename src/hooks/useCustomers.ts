"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listCustomers, type AdminCustomer } from "@/services/customers";

export type CustomerSortValue =
  | "nombre-asc"
  | "nombre-desc"
  | "total-desc"
  | "total-asc"
  | "pedidos-desc"
  | "pedidos-asc"
  | "ultima-desc"
  | "ultima-asc";

export const CUSTOMER_SORT_OPTIONS: { value: CustomerSortValue; label: string }[] = [
  { value: "ultima-desc", label: "Última compra: más reciente" },
  { value: "ultima-asc", label: "Última compra: más antigua" },
  { value: "total-desc", label: "Total gastado: mayor a menor" },
  { value: "total-asc", label: "Total gastado: menor a mayor" },
  { value: "pedidos-desc", label: "Cantidad de pedidos: mayor a menor" },
  { value: "pedidos-asc", label: "Cantidad de pedidos: menor a mayor" },
  { value: "nombre-asc", label: "Nombre: A-Z" },
  { value: "nombre-desc", label: "Nombre: Z-A" },
];

/** Mismo criterio que useProducts.ts/useOrders.ts: services/customers.ts
 * trae los datos, acá se aplica búsqueda + orden en memoria. Sin
 * paginación real todavía -- "preparar, sin implementar" (mismo criterio
 * que Categorías y Pedidos). Sin borrado ni cambio de estado: este módulo
 * es de solo lectura. */
export function useCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CustomerSortValue>("ultima-desc");

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los clientes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const visibleCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? customers.filter(
          (customer) =>
            customer.fullName.toLowerCase().includes(normalizedQuery) ||
            customer.phone.toLowerCase().includes(normalizedQuery) ||
            (customer.email ?? "").toLowerCase().includes(normalizedQuery)
        )
      : customers;

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "nombre-asc":
          return a.fullName.localeCompare(b.fullName);
        case "nombre-desc":
          return b.fullName.localeCompare(a.fullName);
        case "total-desc":
          return b.totalSpent - a.totalSpent;
        case "total-asc":
          return a.totalSpent - b.totalSpent;
        case "pedidos-desc":
          return b.orderCount - a.orderCount;
        case "pedidos-asc":
          return a.orderCount - b.orderCount;
        case "ultima-asc":
          return (a.lastOrderAt ?? "").localeCompare(b.lastOrderAt ?? "");
        case "ultima-desc":
        default:
          return (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? "");
      }
    });
  }, [customers, query, sort]);

  return {
    customers: visibleCustomers,
    totalCount: customers.length,
    isLoading,
    error,
    query,
    setQuery,
    sort,
    setSort,
    refetch: fetchCustomers,
  };
}
