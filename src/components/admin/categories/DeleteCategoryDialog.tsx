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
import type { AdminCategory } from "@/services/categories";

/**
 * Mismo patrón que DeleteProductDialog (controlado, porque AlertDialogAction
 * no cierra el diálogo solo). Si la categoría ya tiene productos asociados
 * (productCount > 0, dato que ya trae el listado), se muestra directamente
 * el bloqueo -- sin ofrecer un botón "Eliminar" que solo va a fallar. El
 * chequeo real e inviolable sigue viviendo en services/categories.ts
 * (deleteCategory), que vuelve a contar en el momento del borrado.
 */
export function DeleteCategoryDialog({
  category,
  onConfirm,
}: {
  category: AdminCategory;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasProducts = category.productCount > 0;

  async function handleConfirm() {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la categoría.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${category.name}`} />}
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar &quot;{category.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasProducts
              ? `Esta categoría tiene ${category.productCount} producto${category.productCount === 1 ? "" : "s"} asociado${category.productCount === 1 ? "" : "s"}. Primero reasigná esos productos a otra categoría o eliminalos -- recién ahí vas a poder eliminar esta categoría.`
              : "Esta acción no se puede deshacer."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {hasProducts ? "Cerrar" : "Cancelar"}
          </AlertDialogCancel>
          {hasProducts ? null : (
            <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
