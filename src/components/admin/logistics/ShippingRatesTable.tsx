"use client";

import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { DeleteShippingRateDialog } from "@/components/admin/logistics/DeleteShippingRateDialog";
import { SHIPPING_RATE_SORT_OPTIONS, useShippingRates } from "@/hooks/useShippingRates";
import { formatPrice } from "@/lib/utils";

/** Mismo layout que CategoriesTable (Fase 13): header + buscador + orden +
 * tabla + acciones. Sin paginación real todavía -- mismo criterio que el
 * resto de los módulos del panel (Categorías/Pedidos/Promociones/Inventario):
 * el contenedor de abajo queda reservado para cuando haga falta. */
export function ShippingRatesTable() {
  const {
    rates,
    totalCount,
    isLoading,
    error,
    query,
    setQuery,
    sort,
    setSort,
    refetch,
    removeRate,
  } = useShippingRates();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tarifas de envío</h1>
          <p className="text-muted-foreground">
            Gestioná las tarifas de envío por ciudad, conectadas directamente a Supabase.
          </p>
        </div>

        <Button nativeButton={false} render={<Link href="/admin/logistica/nueva" />}>
          <Plus className="size-4" />
          Nueva tarifa
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tarifa..."
            aria-label="Buscar tarifa"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          items={SHIPPING_RATE_SORT_OPTIONS}
          value={sort}
          onValueChange={(value) => setSort(value as typeof sort)}
        >
          <SelectTrigger aria-label="Ordenar tarifas" className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHIPPING_RATE_SORT_OPTIONS.map((option) => (
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
        <p className="text-sm text-muted-foreground">Cargando tarifas de envío...</p>
      ) : rates.length === 0 ? (
        <EmptyState
          title={totalCount === 0 ? "Todavía no hay tarifas de envío" : "No encontramos tarifas"}
          description={
            totalCount === 0
              ? "Creá la primera tarifa con el botón \"Nueva tarifa\"."
              : "Probá con otra palabra en la búsqueda."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Ciudades</th>
                  <th className="px-4 py-3">Tiempo estimado</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{rate.name}</td>
                    <td className="px-4 py-3 text-foreground">{formatPrice(rate.price)}</td>
                    <td className="px-4 py-3 text-foreground">
                      {rate.cityCount} ciudad{rate.cityCount === 1 ? "" : "es"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{rate.estimatedDays ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={rate.isActive ? "default" : "outline"}>
                        {rate.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar ${rate.name}`}
                          nativeButton={false}
                          render={<Link href={`/admin/logistica/${rate.id}/editar`} />}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteShippingRateDialog rate={rate} onConfirm={() => removeRate(rate)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {totalCount} tarifa{totalCount === 1 ? "" : "s"} en total
            </p>
            {/* Paginación preparada, no implementada todavía (mismo criterio
                que Categorías/Pedidos/Promociones/Inventario): con un
                puñado de tarifas no hace falta recortar la lista, pero el
                contenedor queda reservado para cuando haga falta. */}
            <div className="mt-0" />
          </div>
        </>
      )}
    </div>
  );
}
