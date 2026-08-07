"use client";

import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { isValidHexColor } from "@/lib/theme";

/**
 * Selector de color reutilizable para "Colores del tema" -- mismo patrón
 * ya establecido en `CategoryForm.tsx` para `accentColor` de categorías
 * (`<input type="color">` nativo emparejado con un `<Input>` de texto,
 * sin agregar ninguna librería nueva), extraído acá porque este sprint lo
 * usa 3 veces seguidas (principal/secundario/botones) -- cruza el umbral
 * de "3 o más lugares" que el proyecto usa para decidir cuándo compartir
 * un componente (CLAUDE.md, principio 6).
 */
export function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const trimmed = value.trim();
  const showError = trimmed.length > 0 && !isValidHexColor(trimmed);
  const pickerValue = isValidHexColor(trimmed) ? trimmed : "#000000";

  return (
    <FormField label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} (selector visual)`}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
        />
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#111111"
          aria-label={`${label} (hexadecimal)`}
          className="flex-1 font-mono uppercase"
        />
      </div>
      {showError ? (
        <p className="text-xs text-destructive">Formato inválido. Usá #RRGGBB, ej. #FF5500.</p>
      ) : null}
    </FormField>
  );
}
