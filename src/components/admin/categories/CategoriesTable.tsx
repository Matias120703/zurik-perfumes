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
import { DeleteCategoryDialog } from "@/components/admin/categories/DeleteCategoryDialog";
import { getCategoryIcon } from "@/components/admin/categories/category-icons";
import { CATEGORY_SORT_OPTIONS, useCategories } from "@/hooks/useCategories";

/** Mismo layout que ProductsTable (Fase 10): header + buscador + orden +
 * tabla + acciones. Sin paginación real todavía -- el sprint pidió
 * "preparar, sin implementar" (el listado de categorías de una tienda
 * chica es corto, mismo criterio que ya documentó Sprint 4.4 para
 * /categorias público); el contenedor de abajo queda reservado, mismo
 * patrón que ya usa /productos (storefront) para su propia paginación
 * pendiente. */
export function CategoriesTable() {
  const {
    categories,
    totalCount,
    isLoading,
    error,
    query,
    setQuery,
    sort,
    setSort,
    refetch,
    removeCategory,
  } = useCategories();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Categorías</h1>
          <p className="text-muted-foreground">
            Gestioná las categorías del catálogo, conectadas directamente a Supabase.
          </p>
        </div>

        <Button nativeButton={false} render={<Link href="/admin/categorias/nueva" />}>
          <Plus className="size-4" />
          Nueva categoría
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar categoría..."
            aria-label="Buscar categoría"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          items={CATEGORY_SORT_OPTIONS}
          value={sort}
          onValueChange={(value) => setSort(value as typeof sort)}
        >
          <SelectTrigger aria-label="Ordenar categorías" className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_SORT_OPTIONS.map((option) => (
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
        <p className="text-sm text-muted-foreground">Cargando categorías...</p>
      ) : categories.length === 0 ? (
        <EmptyState
          title={totalCount === 0 ? "Todavía no hay categorías" : "No encontramos categorías"}
          description={
            totalCount === 0
              ? "Creá la primera categoría del catálogo con el botón \"Nueva categoría\"."
              : "Probá con otra palabra en la búsqueda."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Color</th>
                  <th className="px-4 py-3">Ícono</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Productos</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const CategoryIcon = getCategoryIcon(category.iconName);
                  return (
                    <tr key={category.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <span
                          aria-hidden="true"
                          className="block size-6 rounded-full border border-border"
                          style={{ backgroundColor: category.accentColor ?? "transparent" }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/60">
                          <CategoryIcon className="size-4 text-foreground" aria-hidden="true" />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{category.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{category.slug}</td>
                      <td className="px-4 py-3 text-foreground">{category.productCount}</td>
                      <td className="px-4 py-3">
                        <Badge variant={category.isActive ? "default" : "outline"}>
                          {category.isActive ? "Activa" : "Inactiva"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground">{category.displayOrder}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${category.name}`}
                            nativeButton={false}
                            render={<Link href={`/admin/categorias/${category.id}/editar`} />}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <DeleteCategoryDialog
                            category={category}
                            onConfirm={() => removeCategory(category)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {totalCount} categoría{totalCount === 1 ? "" : "s"} en total
            </p>
            {/* Paginación preparada, no implementada todavía (alcance de este
                sprint): con un puñado de categorías no hace falta recortar
                la lista, pero el contenedor queda reservado para cuando el
                catálogo de un cliente crezca lo suficiente. */}
            <div className="mt-0" />
          </div>
        </>
      )}
    </div>
  );
}
