"use client";

import { useState } from "react";
import { CreditCard, Info, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import type { PaymentMethod } from "@/lib/payment-methods";
import type { PaymentMethodInput } from "@/services/payment-methods";

const INSTRUCTIONS_PLACEHOLDER = `Banco: Itaú
Titular: Juan Pérez
CI/RUC: 1.234.567
Cuenta: 123456789
Alias: zurik`;

/**
 * Administra `payment_methods`. A diferencia de Productos/Categorías,
 * NO se dividió en tabla + páginas de alta/edición: son unos pocos
 * registros de 4 campos que el dueño toca muy de vez en cuando, y
 * abrir una página por método para escribir dos líneas de datos
 * bancarios sería más fricción que ayuda. Cada método se edita en su
 * propia tarjeta y se guarda por separado -- son independientes entre
 * sí, así que no hay ninguna razón para un submit único como en
 * Configuración.
 */
export function PaymentMethodsManager() {
  const { methods, isLoading, error, create, update, remove } = usePaymentMethods();
  const [isCreating, setIsCreating] = useState(false);

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando métodos de pago...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Los métodos activos son los que ve el cliente al elegir cómo pagar. Los que tengan{" "}
          <span className="font-medium text-foreground">datos de pago</span> cargados se los
          muestran en el checkout, se los repiten en la confirmación y se los mandan en el
          mensaje de WhatsApp, junto con el pedido de que adjunte el comprobante.
        </p>
      </div>

      {methods.length === 0 && !isCreating ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Todavía no hay ningún método de pago. Mientras no cargues ninguno, el checkout le
          avisa al cliente que el pago se coordina por WhatsApp.
        </p>
      ) : null}

      {methods.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          onSave={(input) => update(method.id, input)}
          onDelete={() => remove(method.id)}
        />
      ))}

      {isCreating ? (
        <PaymentMethodCard
          method={{
            id: "",
            name: "",
            instructions: null,
            isActive: true,
            displayOrder: methods.length,
          }}
          isNew
          onSave={async (input) => {
            await create(input);
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="size-4" aria-hidden="true" />
          Agregar método de pago
        </Button>
      )}
    </div>
  );
}

function PaymentMethodCard({
  method,
  isNew,
  onSave,
  onDelete,
  onCancel,
}: {
  method: PaymentMethod;
  isNew?: boolean;
  onSave: (input: PaymentMethodInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(method.name);
  const [instructions, setInstructions] = useState(method.instructions ?? "");
  const [isActive, setIsActive] = useState(method.isActive);
  const [displayOrder, setDisplayOrder] = useState(String(method.displayOrder));

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const isDirty =
    name !== method.name ||
    instructions !== (method.instructions ?? "") ||
    isActive !== method.isActive ||
    displayOrder !== String(method.displayOrder);

  async function handleSave() {
    if (!name.trim()) {
      setCardError("El nombre es obligatorio.");
      return;
    }

    setIsSaving(true);
    setCardError(null);
    setMessage(null);

    try {
      await onSave({
        name,
        instructions: instructions.trim() || null,
        isActive,
        displayOrder: Number(displayOrder) || 0,
      });
      setMessage("Guardado.");
    } catch (err) {
      setCardError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setIsDeleting(true);
    setCardError(null);
    try {
      await onDelete();
    } catch (err) {
      setCardError(err instanceof Error ? err.message : "No se pudo eliminar.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
            <CreditCard className="size-4 text-foreground" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            {isNew ? "Nuevo método de pago" : method.name}
          </h2>
        </div>

        <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          {isActive ? "Visible" : "Oculto"}
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_140px]">
        <FormField label="Nombre" htmlFor={`payment-name-${method.id || "new"}`} required>
          <Input
            id={`payment-name-${method.id || "new"}`}
            value={name}
            placeholder="Transferencia bancaria"
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>

        <FormField label="Orden" htmlFor={`payment-order-${method.id || "new"}`}>
          <Input
            id={`payment-order-${method.id || "new"}`}
            type="number"
            value={displayOrder}
            onChange={(event) => setDisplayOrder(event.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Datos de pago" htmlFor={`payment-instructions-${method.id || "new"}`}>
        <Textarea
          id={`payment-instructions-${method.id || "new"}`}
          rows={6}
          value={instructions}
          placeholder={INSTRUCTIONS_PLACEHOLDER}
          onChange={(event) => setInstructions(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Dejalo vacío en los métodos que no lo necesiten (efectivo, pago contra entrega). Lo
          que escribas se muestra tal cual, respetando los saltos de línea.
        </p>
      </FormField>

      {cardError ? <p className="text-sm text-destructive">{cardError}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={isSaving || (!isNew && !isDirty)}>
          {isSaving ? "Guardando..." : isNew ? "Crear método" : "Guardar cambios"}
        </Button>

        {isNew ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        )}
      </div>
    </div>
  );
}
