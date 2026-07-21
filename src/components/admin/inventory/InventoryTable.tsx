"use client";

import Link from "next/link";
import { Eye, Search } from "lucide-react";

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
import { getInventoryStatusLabel, getInventoryStatusVariant } from "@/components/admin/inventory/inventory-status";
import { INVENTORY_SORT_OPTIONS, useInventory } from "@/hooks/useInventory";
import { formatDate } from "@/lib/utils";
import { getMovementTypeLabel } from "@/services/inventory";

/** Mismo layout que ProductsTable/OrdersTable/PromotionsTable: header +
 * buscador + orden + tabla + acciones. Sin alta ni baja acá -- los
 * productos se crean/eliminan desde /admin/productos (protegido este
 * sprint); Inventario administra el stock de los que ya existen. */
export function InventoryTable() {
  const { items, totalCount, isLoading, error, query, setQuery, sort, setSort, refetch } = useInventory();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventario</h1>
        <p className="text-muted-foreground">
          Controlá el stock de cada producto y su historial de movimientos, conectado directamente a Supabase.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            aria-label="Buscar producto"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          items={INVENTORY_SORT_OPTIONS}
          value={sort}
          onValueChange={(value) => setSort(value as typeof sort)}
        >
          <SelectTrigger aria-label="Ordenar inventario" className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVENTORY_SORT_OPTIONS.map((option) => (
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
        <p className="text-sm text-muted-foreground">Cargando inventario...</p>
      ) : items.length === 0 ? (
        <EmptyState
          title={totalCount === 0 ? "Todavía no hay productos" : "No encontramos productos"}
          description={
            totalCount === 0
              ? "Los productos que cargues desde el panel van a aparecer acá."
              : "Probá con otra palabra en la búsqueda."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Stock actual</th>
                  <th className="px-4 py-3">Stock mínimo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Último movimiento</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{item.name}</span>
                        {item.categoryName ? (
                          <span className="text-xs text-muted-foreground">{item.categoryName}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.sku ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{item.stock}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.lowStockThreshold}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getInventoryStatusVariant(item.status)}>
                        {getInventoryStatusLabel(item.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {item.lastMovementAt ? (
                        <div className="flex flex-col">
                          <span>{formatDate(item.lastMovementAt)}</span>
                          <span className="text-xs">
                            {item.lastMovementType ? getMovementTypeLabel(item.lastMovementType) : null}
                          </span>
                        </div>
                      ) : (
                        "Sin movimientos"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ver movimientos de ${item.name}`}
                          nativeButton={false}
                          render={<Link href={`/admin/inventario/${item.productId}`} />}
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
              {totalCount} producto{totalCount === 1 ? "" : "s"} en total
            </p>
            {/* Paginación preparada, no implementada todavía -- mismo
                criterio que Categorías/Pedidos/Clientes/Promociones. */}
            <div className="mt-0" />
          </div>
        </>
      )}
    </div>
  );
}
