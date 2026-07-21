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
import { DeletePromotionDialog } from "@/components/admin/promotions/DeletePromotionDialog";
import { getPromotionStatusLabel, getPromotionStatusVariant } from "@/components/admin/promotions/promotion-status";
import { PROMOTION_SORT_OPTIONS, usePromotions } from "@/hooks/usePromotions";
import { formatDiscountLabel } from "@/lib/promotions";
import { formatDate } from "@/lib/utils";

const DISCOUNT_TYPE_LABEL = { percentage: "Porcentaje", fixed_amount: "Monto fijo" } as const;

/** Mismo layout que ProductsTable/CategoriesTable/OrdersTable: header +
 * buscador + orden + tabla + acciones. Sin filtro por estado (a
 * diferencia de Pedidos): el sprint no lo pidió para Promociones, solo
 * "ordenar por estado" -- buscador + 3 criterios de orden alcanzan. */
export function PromotionsTable() {
  const {
    promotions,
    totalCount,
    isLoading,
    error,
    query,
    setQuery,
    sort,
    setSort,
    refetch,
    removePromotion,
  } = usePromotions();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Promociones</h1>
          <p className="text-muted-foreground">
            Gestioná las campañas de descuento de la tienda, conectadas directamente a Supabase.
          </p>
        </div>

        <Button nativeButton={false} render={<Link href="/admin/promociones/nueva" />}>
          <Plus className="size-4" />
          Nueva promoción
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, producto o categoría..."
            aria-label="Buscar promoción"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          items={PROMOTION_SORT_OPTIONS}
          value={sort}
          onValueChange={(value) => setSort(value as typeof sort)}
        >
          <SelectTrigger aria-label="Ordenar promociones" className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROMOTION_SORT_OPTIONS.map((option) => (
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
        <p className="text-sm text-muted-foreground">Cargando promociones...</p>
      ) : promotions.length === 0 ? (
        <EmptyState
          title={totalCount === 0 ? "Todavía no hay promociones" : "No encontramos promociones"}
          description={
            totalCount === 0
              ? "Creá la primera campaña de descuento con el botón \"Nueva promoción\"."
              : "Probá con otra palabra en la búsqueda."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Producto / Categoría</th>
                  <th className="px-4 py-3">Descuento</th>
                  <th className="px-4 py-3">Fecha inicio</th>
                  <th className="px-4 py-3">Fecha fin</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promotion) => (
                  <tr key={promotion.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{promotion.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {DISCOUNT_TYPE_LABEL[promotion.discountType]}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {promotion.categoryName ?? promotion.productName ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatDiscountLabel(promotion.discountType, promotion.discountValue)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(promotion.startsAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(promotion.endsAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getPromotionStatusVariant(promotion.status)}>
                        {getPromotionStatusLabel(promotion.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar ${promotion.title}`}
                          nativeButton={false}
                          render={<Link href={`/admin/promociones/${promotion.id}/editar`} />}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <DeletePromotionDialog
                          promotion={promotion}
                          onConfirm={() => removePromotion(promotion)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {totalCount} promoción{totalCount === 1 ? "" : "es"} en total
            </p>
            {/* Paginación preparada, no implementada todavía -- mismo
                criterio que Categorías/Pedidos/Clientes. */}
            <div className="mt-0" />
          </div>
        </>
      )}
    </div>
  );
}
