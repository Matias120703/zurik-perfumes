"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { getInventoryStatusLabel, getInventoryStatusVariant, getMovementTypeVariant } from "@/components/admin/inventory/inventory-status";
import { StockMovementForm } from "@/components/admin/inventory/StockMovementForm";
import { useInventoryItem } from "@/hooks/useInventoryItem";
import { formatDate } from "@/lib/utils";
import { getMovementTypeLabel } from "@/services/inventory";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

/** Formulario chico, inline -- no se extrajo a un archivo propio porque
 * solo tiene 2 campos y un único consumidor (mismo criterio que
 * Section/Row en OrderDetailView.tsx). Escribe sku/low_stock_threshold en
 * `products` vía services/inventory.ts, nunca vía services/products.ts
 * (Productos, protegido este sprint). */
function InventorySettingsForm({
  sku,
  lowStockThreshold,
  isSubmitting,
  onSubmit,
}: {
  sku: string | null;
  lowStockThreshold: number;
  isSubmitting: boolean;
  onSubmit: (input: { sku: string | null; lowStockThreshold: number }) => Promise<boolean>;
}) {
  const [skuValue, setSkuValue] = useState(sku ?? "");
  const [thresholdValue, setThresholdValue] = useState(String(lowStockThreshold));
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setSkuValue(sku ?? "");
    setThresholdValue(String(lowStockThreshold));
  }, [sku, lowStockThreshold]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJustSaved(false);

    const thresholdNumber = Number(thresholdValue);
    if (!thresholdValue.trim() || Number.isNaN(thresholdNumber) || thresholdNumber < 0) {
      setFieldError("El stock mínimo debe ser 0 o mayor.");
      return;
    }
    setFieldError(null);

    const success = await onSubmit({ sku: skuValue.trim() || null, lowStockThreshold: thresholdNumber });
    if (success) setJustSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="SKU" htmlFor="sku">
          <Input
            id="sku"
            placeholder="Opcional"
            value={skuValue}
            onChange={(event) => setSkuValue(event.target.value)}
          />
        </FormField>

        <FormField label="Stock mínimo" htmlFor="lowStockThreshold" required>
          <Input
            id="lowStockThreshold"
            type="number"
            min={0}
            step="1"
            value={thresholdValue}
            onChange={(event) => setThresholdValue(event.target.value)}
          />
        </FormField>
      </div>

      {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
      {justSaved ? <p className="text-sm text-emerald-600">Configuración guardada.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </form>
  );
}

export function InventoryDetailView({ productId }: { productId: string }) {
  const { item, movements, isLoading, error, isSubmitting, submitMovement, saveSettings } =
    useInventoryItem(productId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando inventario...</p>;
  }

  if (!item) {
    return <p className="text-sm text-destructive">{error ?? "No se encontró el producto."}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{item.name}</h1>
          <p className="text-muted-foreground">
            {item.categoryName ?? "Sin categoría"} {item.sku ? `· SKU ${item.sku}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={getInventoryStatusVariant(item.status)}>{getInventoryStatusLabel(item.status)}</Badge>
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/inventario" />}>
            Volver
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Section title="Registrar movimiento">
            <StockMovementForm currentStock={item.stock} isSubmitting={isSubmitting} onSubmit={submitMovement} />
          </Section>

          <Section title="Historial de movimientos">
            {movements.length === 0 ? (
              <EmptyState
                title="Todavía no hay movimientos"
                description="Los movimientos manuales y los generados por pedidos van a aparecer acá."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                      <th className="py-2 pr-4">Fecha</th>
                      <th className="py-2 pr-4">Tipo</th>
                      <th className="py-2 pr-4">Cantidad</th>
                      <th className="py-2 pr-4">Stock anterior</th>
                      <th className="py-2 pr-4">Stock posterior</th>
                      <th className="py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr key={movement.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                          {formatDate(movement.createdAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={getMovementTypeVariant(movement.type)}>
                            {getMovementTypeLabel(movement.type)}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 font-medium text-foreground">
                          {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{movement.previousStock}</td>
                        <td className="py-3 pr-4 font-medium text-foreground">{movement.newStock}</td>
                        <td className="py-3 text-muted-foreground">
                          {movement.reason ?? "—"}
                          {movement.orderNumber ? ` (Pedido #${movement.orderNumber})` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Stock actual">
            <p className="text-4xl font-bold text-foreground">{item.stock}</p>
            <p className="text-sm text-muted-foreground">Stock mínimo configurado: {item.lowStockThreshold}</p>
          </Section>

          <Section title="Configuración de inventario">
            <InventorySettingsForm
              sku={item.sku}
              lowStockThreshold={item.lowStockThreshold}
              isSubmitting={isSubmitting}
              onSubmit={saveSettings}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
