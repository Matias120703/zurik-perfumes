"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  GUARANTEE_ICON_OPTIONS,
  getGuaranteeIcon,
} from "@/components/storefront/guarantee-icons";
import type { HomeGuarantee } from "@/lib/home-content";

const MAX_GUARANTEES = 6;

/** Etiquetas legibles para el selector -- la base guarda el identificador. */
const ICON_LABELS: Record<string, string> = {
  "badge-check": "Verificado",
  "shield-check": "Escudo",
  truck: "Envío",
  "message-circle": "Mensaje",
  "hand-coins": "Precio / dinero",
  headphones: "Atención",
  sparkles: "Brillo",
  gem: "Gema",
  star: "Estrella",
  heart: "Corazón",
  package: "Paquete",
  clock: "Reloj",
  wallet: "Billetera",
};

const ICON_ITEMS = GUARANTEE_ICON_OPTIONS.map((value) => ({
  value,
  label: ICON_LABELS[value] ?? value,
}));

/**
 * Editor de la lista de garantías de la Home. Cada ítem es un ícono (un
 * identificador de texto, resuelto a un componente sólo al mostrarlo),
 * un título y una descripción.
 *
 * Igual que `StringListField`, es controlado: emite el array completo
 * hacia arriba y no guarda nada por su cuenta -- el submit sigue siendo
 * uno solo, el del formulario.
 */
export function GuaranteesField({
  items,
  onChange,
}: {
  items: HomeGuarantee[];
  onChange: (next: HomeGuarantee[]) => void;
}) {
  function updateAt(index: number, patch: Partial<HomeGuarantee>) {
    onChange(
      items.map((current, position) =>
        position === index ? { ...current, ...patch } : current
      )
    );
  }

  function removeAt(index: number) {
    onChange(items.filter((_, position) => position !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Sin garantías cargadas, esta sección no aparece en la tienda.
        </p>
      ) : null}

      {items.map((guarantee, index) => {
        const Icon = getGuaranteeIcon(guarantee.icon);

        return (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                <Icon className="size-5 text-foreground" aria-hidden="true" />
              </span>

              <div className="grid flex-1 gap-4 sm:grid-cols-[160px_1fr]">
                <FormField label="Ícono" htmlFor={`guarantee-icon-${index}`}>
                  <Select
                    items={ICON_ITEMS}
                    value={guarantee.icon}
                    onValueChange={(value) => updateAt(index, { icon: String(value) })}
                  >
                    <SelectTrigger id={`guarantee-icon-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_ITEMS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Título" htmlFor={`guarantee-title-${index}`}>
                  <Input
                    id={`guarantee-title-${index}`}
                    value={guarantee.title}
                    placeholder="100% Originales"
                    onChange={(event) => updateAt(index, { title: event.target.value })}
                  />
                </FormField>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Eliminar garantía"
                onClick={() => removeAt(index)}
              >
                <Trash2 className="size-4 text-destructive" aria-hidden="true" />
              </Button>
            </div>

            <FormField label="Descripción" htmlFor={`guarantee-description-${index}`}>
              <Textarea
                id={`guarantee-description-${index}`}
                rows={2}
                value={guarantee.description}
                placeholder="Todas nuestras fragancias son originales y selladas."
                onChange={(event) => updateAt(index, { description: event.target.value })}
              />
            </FormField>
          </div>
        );
      })}

      {items.length < MAX_GUARANTEES ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() =>
            onChange([...items, { icon: "badge-check", title: "", description: "" }])
          }
        >
          <Plus className="size-4" aria-hidden="true" />
          Agregar garantía
        </Button>
      ) : null}
    </div>
  );
}
