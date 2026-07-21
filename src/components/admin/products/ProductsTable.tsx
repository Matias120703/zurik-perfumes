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
import { DeleteProductDialog } from "@/components/admin/products/DeleteProductDialog";
import { PRODUCT_SORT_OPTIONS, useProducts } from "@/hooks/useProducts";
import { isRealImageUrl } from "@/lib/products";
import { formatPrice } from "@/lib/utils";

export function ProductsTable() {
  const {
    products,
    totalCount,
    isLoading,
    error,
    query,
    setQuery,
    sort,
    setSort,
    page,
    totalPages,
    setPage,
    refetch,
    removeProduct,
  } = useProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Productos</h1>
          <p className="text-muted-foreground">Gestioná el catálogo completo, conectado directamente a Supabase.</p>
        </div>

        <Button nativeButton={false} render={<Link href="/admin/productos/nuevo" />}>
          <Plus className="size-4" />
          Nuevo producto
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            aria-label="Buscar producto"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          items={PRODUCT_SORT_OPTIONS}
          value={sort}
          onValueChange={(value) => setSort(value as typeof sort)}
        >
          <SelectTrigger aria-label="Ordenar productos" className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_SORT_OPTIONS.map((option) => (
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
        <p className="text-sm text-muted-foreground">Cargando productos...</p>
      ) : products.length === 0 ? (
        <EmptyState
          title={totalCount === 0 ? "Todavía no hay productos" : "No encontramos productos"}
          description={
            totalCount === 0
              ? "Creá el primer producto del catálogo con el botón \"Nuevo producto\"."
              : "Probá con otra palabra en la búsqueda."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Imagen</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Destacado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  // Los 5 productos sembrados originalmente (Fase 8) guardan
                  // rutas de placeholder (`/products/iphone-14-1.jpg`) que
                  // nunca existieron como archivo real -- mismo criterio que
                  // ProductCard/ProductGallery (Fase 12, isRealImageUrl):
                  // sin esta guarda, la miniatura del panel pedía esa URL y
                  // rompía con un 404 silencioso (auditoría, Sprint 6.0.1).
                  const mainImage = product.images.find((image) => isRealImageUrl(image.url));
                  return (
                    <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex size-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/60">
                          {mainImage ? (
                            // eslint-disable-next-line @next/next/no-img-element -- thumbnail interno del panel
                            <img src={mainImage.url} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="text-lg font-semibold text-foreground/20">
                              {product.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{product.categoryName ?? "—"}</td>
                      <td className="px-4 py-3 text-foreground">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3 text-foreground">{product.stock}</td>
                      <td className="px-4 py-3">
                        <Badge variant={product.isActive ? "default" : "outline"}>
                          {product.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={product.featured ? "secondary" : "outline"}>
                          {product.featured ? "Sí" : "No"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${product.name}`}
                            nativeButton={false}
                            render={<Link href={`/admin/productos/${product.id}/editar`} />}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <DeleteProductDialog product={product} onConfirm={() => removeProduct(product)} />
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
              {totalCount} producto{totalCount === 1 ? "" : "s"} en total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
