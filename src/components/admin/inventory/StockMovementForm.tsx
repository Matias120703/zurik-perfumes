"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { StockAdjustmentInput } from "@/services/inventory";

type ActionType = "in" | "adjustment_positive" | "adjustment_negative";

const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
  { value: "in", label: "Entrada de stock" },
  { value: "adjustment_positive", label: "Ajuste positivo" },
  { value: "adjustment_negative", label: "Ajuste negativo" },
];

/**
 * Las 3 acciones que pidió el sprint ("Entrada de stock", "Ajuste
 * positivo", "Ajuste negativo") se traducen a los 2 tipos que acepta
 * `register_stock_movement` (`manual_in`/`manual_adjustment`) + el signo
 * de la cantidad -- el backend nunca ve "entrada"/"ajuste" como tal, solo
 * un tipo + un delta con signo. La validación de "no restar más de lo que
 * hay" ocurre acá para UX inmediata, pero la garantía real ("nunca
 * permitir stock negativo") la sigue enforzando la función de Postgres,
 * que rechaza el ajuste incluso si esta validación tuviera un bug o si
 * dos admins ajustan el mismo producto a la vez.
 */
export function StockMovementForm({
  currentStock,
  isSubmitting,
  onSubmit,
}: {
  currentStock: number;
  isSubmitting: boolean;
  onSubmit: (input: Omit<StockAdjustmentInput, "productId">) => Promise<boolean>;
}) {
  const [actionType, setActionType] = useState<ActionType>("in");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJustSaved(false);

    const amountNumber = Number(amount);
    if (!amount.trim() || Number.isNaN(amountNumber) || amountNumber <= 0) {
      setFieldError("Ingresá una cantidad válida, mayor a 0.");
      return;
    }
    if (!reason.trim()) {
      setFieldError("El motivo es obligatorio.");
      return;
    }
    if (actionType === "adjustment_negative" && amountNumber > currentStock) {
      setFieldError(`No podés restar más de lo que hay en stock (stock actual: ${currentStock}).`);
      return;
    }
    setFieldError(null);

    const type = actionType === "in" ? "manual_in" : "manual_adjustment";
    const quantity = actionType === "adjustment_negative" ? -amountNumber : amountNumber;

    const success = await onSubmit({ type, quantity, reason: reason.trim() });
    if (success) {
      setAmount("");
      setReason("");
      setJustSaved(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tipo de movimiento" htmlFor="movementType" required>
          <Select
            items={ACTION_OPTIONS}
            value={actionType}
            onValueChange={(value) => setActionType(value as ActionType)}
          >
            <SelectTrigger id="movementType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Cantidad" htmlFor="amount" required>
          <Input
            id="amount"
            type="number"
            min={1}
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Motivo" htmlFor="reason" required>
        <Textarea
          id="reason"
          rows={2}
          placeholder="Ej: reposición de proveedor, conteo físico, producto dañado..."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </FormField>

      {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
      {justSaved ? <p className="text-sm text-emerald-600">Movimiento registrado correctamente.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Registrar movimiento"}
        </Button>
      </div>
    </form>
  );
}
