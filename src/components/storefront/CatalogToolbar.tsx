"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_SORT_OPTIONS, type ProductSortValue } from "@/lib/sort";

/**
 * Barra superior del catálogo: cantidad de resultados + selector de
 * orden. No decide ni aplica el ordenamiento — es un componente
 * controlado, igual que ShippingInformation/PaymentMethod con sus
 * RadioGroup: recibe el valor actual y avisa cuando cambia. Quien
 * realmente ordena es CatalogResults (Sprint 4.3).
 */
export function CatalogToolbar({
  productCount,
  sort,
  onSortChange = () => {},
}: {
  productCount: number;
  sort: ProductSortValue;
  /**
   * Opcional a propósito: el fallback de Suspense en app/productos/page.tsx
   * es un Server Component y no puede pasar una función como prop a este
   * Client Component (no serializa). Sin handler, el default no-op vive
   * acá adentro, nunca cruza ese límite servidor/cliente.
   */
  onSortChange?: (value: ProductSortValue) => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {productCount} {productCount === 1 ? "producto" : "productos"}
      </p>

      <Select
        items={PRODUCT_SORT_OPTIONS}
        value={sort}
        onValueChange={(value) => onSortChange(value as ProductSortValue)}
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
  );
}
