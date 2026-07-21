"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { AdminShippingRate } from "@/services/logistics";

/**
 * Mismo patrón que DeleteCategoryDialog/DeleteProductDialog (controlado,
 * porque AlertDialogAction no cierra el diálogo solo). Sin bloqueo de
 * integridad referencial que chequear -- a diferencia de Categorías,
 * `orders.shipping_rate_id` es `on delete set null` (Sprint 6.2): un
 * pedido viejo no impide borrar la tarifa que usó.
 */
export function DeleteShippingRateDialog({
  rate,
  onConfirm,
}: {
  rate: AdminShippingRate;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la tarifa.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${rate.name}`} />}
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar &quot;{rate.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Los pedidos que ya usaron esta tarifa conservan su
            costo de envío guardado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
