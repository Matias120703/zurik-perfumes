"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getInventoryItemById,
  getInventoryStatus,
  listMovements,
  registerStockMovement,
  updateInventorySettings,
  type AdminInventoryItem,
  type AdminStockMovement,
  type InventorySettingsInput,
  type StockAdjustmentInput,
} from "@/services/inventory";

/** Mismo patrón que useOrder.ts/useCustomer.ts, para /admin/inventario/[id]:
 * un producto + su historial completo de movimientos, más las dos
 * acciones de escritura (registrar movimiento, guardar SKU/stock mínimo).
 * Ninguna de las dos vuelve a llamar a `fetchAll()` al terminar --
 * `fetchAll` marca `isLoading = true`, y como InventoryDetailView
 * reemplaza toda la vista mientras `isLoading` es true, un refetch
 * después de cada movimiento desmontaba y remontaba StockMovementForm en
 * cada envío exitoso, reseteando el tipo de movimiento seleccionado al
 * default ("Entrada de stock") sin avisar -- un bug real encontrado en la
 * verificación de este mismo sprint. En su lugar, ambas actualizan el
 * estado local de forma optimista con el resultado que ya devuelve la
 * escritura (mismo criterio que useOrder.ts/useOrders.ts, CLAUDE.md
 * sección 11), sin volver a pedir nada a Supabase. */
export function useInventoryItem(productId: string) {
  const [item, setItem] = useState<AdminInventoryItem | null>(null);
  const [movements, setMovements] = useState<AdminStockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [itemData, movementsData] = await Promise.all([
        getInventoryItemById(productId),
        listMovements(productId),
      ]);
      setItem(itemData);
      setMovements(movementsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el inventario del producto.");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function submitMovement(input: Omit<StockAdjustmentInput, "productId">): Promise<boolean> {
    setIsSubmitting(true);
    setError(null);
    try {
      const movement = await registerStockMovement({ ...input, productId });
      setItem((current) =>
        current
          ? {
              ...current,
              stock: movement.newStock,
              status: getInventoryStatus(movement.newStock, current.lowStockThreshold),
              lastMovementAt: movement.createdAt,
              lastMovementType: movement.type,
            }
          : current
      );
      setMovements((current) => [movement, ...current]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el movimiento.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveSettings(input: InventorySettingsInput): Promise<boolean> {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateInventorySettings(productId, input);
      setItem((current) =>
        current
          ? {
              ...current,
              sku: input.sku,
              lowStockThreshold: input.lowStockThreshold,
              status: getInventoryStatus(current.stock, input.lowStockThreshold),
            }
          : current
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la configuración de inventario.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    item,
    movements,
    isLoading,
    error,
    isSubmitting,
    submitMovement,
    saveSettings,
    refetch: fetchAll,
  };
}
