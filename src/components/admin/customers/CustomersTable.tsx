"use client";

import Link from "next/link";
import { Eye, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { CUSTOMER_SORT_OPTIONS, useCustomers } from "@/hooks/useCustomers";
import { formatDate, formatPrice } from "@/lib/utils";

/** Mismo layout que OrdersTable/CategoriesTable: header + buscador + orden
 * + tabla + acciones. Sin paginación real todavía -- mismo criterio que
 * Categorías (Fase 13) y Pedidos (Fase 15). Sin acciones de crear/editar/
 * eliminar: los clientes se crean solos (create_order, Fase 15), este
 * módulo solo consulta. */
export function CustomersTable() {
  const { customers, totalCount, isLoading, error, query, setQuery, sort, setSort, refetch } =
    useCustomers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h1>
        <p className="text-muted-foreground">
          Consultá los clientes que compraron en la tienda, generados automáticamente a partir de sus pedidos.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            aria-label="Buscar cliente"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select items={CUSTOMER_SORT_OPTIONS} value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
          <SelectTrigger aria-label="Ordenar clientes" className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CUSTOMER_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Reintentar
          </Button>
        </div>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando clientes...</p>
      ) : customers.length === 0 ? (
        <EmptyState
          title={totalCount === 0 ? "Todavía no hay clientes" : "No encontramos clientes"}
          description={
            totalCount === 0
              ? "Los clientes se crean solos apenas se registra el primer pedido de la tienda."
              : "Probá con otra búsqueda."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Pedidos</th>
                  <th className="px-4 py-3">Total gastado</th>
                  <th className="px-4 py-3">Última compra</th>
                  <th className="px-4 py-3">Cliente desde</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{customer.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.email ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground">{customer.orderCount}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatPrice(customer.totalSpent)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ver cliente ${customer.fullName}`}
                          nativeButton={false}
                          render={<Link href={`/admin/clientes/${customer.id}`} />}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {totalCount} cliente{totalCount === 1 ? "" : "s"} en total
            </p>
            {/* Paginación preparada, no implementada todavía -- mismo
                criterio que /admin/categorias (Fase 13) y /admin/pedidos
                (Fase 15). */}
            <div className="mt-0" />
          </div>
        </>
      )}
    </div>
  );
}
