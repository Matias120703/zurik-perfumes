"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Editor de una lista corta de textos (mensajes de la barra de anuncios,
 * beneficios del bloque mayorista).
 *
 * Es un componente controlado puro: no guarda nada por su cuenta, sólo
 * emite el array completo hacia arriba en cada cambio -- así el
 * formulario sigue teniendo un único submit, igual que
 * `SettingsForm.tsx`. Sin drag & drop: reordenar 3 o 4 líneas se resuelve
 * con las flechas de subir/bajar, y una librería de arrastre sería
 * sobreingeniería para eso.
 */
export function StringListField({
  items,
  onChange,
  placeholder,
  addLabel,
  maxItems = 8,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
  maxItems?: number;
}) {
  function updateAt(index: number, value: string) {
    onChange(items.map((current, position) => (position === index ? value : current)));
  }

  function removeAt(index: number) {
    onChange(items.filter((_, position) => position !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Todavía no agregaste ninguno. Mientras la lista esté vacía, esta parte no se muestra
          en la tienda.
        </p>
      ) : null}

      {items.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              aria-label={`Subir "${value || "elemento"}"`}
              className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === items.length - 1}
              aria-label={`Bajar "${value || "elemento"}"`}
              className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown className="size-4" aria-hidden="true" />
            </button>
          </div>

          <Input
            value={value}
            placeholder={placeholder}
            onChange={(event) => updateAt(index, event.target.value)}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Eliminar"
            onClick={() => removeAt(index)}
          >
            <Trash2 className="size-4 text-destructive" aria-hidden="true" />
          </Button>
        </div>
      ))}

      {items.length < maxItems ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => onChange([...items, ""])}
        >
          <Plus className="size-4" aria-hidden="true" />
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}
