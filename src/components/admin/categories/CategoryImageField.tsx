"use client";

import { useRef } from "react";
import { Image as ImageIcon, X } from "lucide-react";

import { FormField } from "@/components/shared/FormField";
import { MAX_CATEGORY_IMAGE_SIZE_MB } from "@/services/categories";

export type PendingCategoryImage = { file: File; previewUrl: string } | null;

/**
 * Imagen 1:1 por categoría (Sprint 6.6) -- mismo patrón que
 * `BrandingAssetField.tsx` (un único archivo, no una galería como
 * `ProductImagesField.tsx`): nada se sube a Storage hasta que se confirma
 * el guardado, el archivo elegido queda "pendiente" con preview local
 * (`URL.createObjectURL`) y `CategoryForm.tsx` decide subir/reemplazar/
 * borrar recién en el submit. Preview más grande que la de Branding
 * (rectangular, `aspect-[4/3]`) para reflejar de verdad cómo se va a ver
 * en la tarjeta de categoría de la tienda -- un logo de 64px no comunica
 * lo mismo que una foto de portada de categoría.
 */
export function CategoryImageField({
  currentUrl,
  pending,
  error,
  onSelectFile,
  onRemove,
}: {
  currentUrl: string | null;
  pending: PendingCategoryImage;
  /** Error de validación (tamaño/tipo) -- se muestra antes de intentar
   * subir nada, no un error de Supabase después de guardar. */
  error?: string | null;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = pending?.previewUrl ?? currentUrl;

  return (
    <FormField label="Imagen de la categoría" htmlFor="categoryImage">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative flex aspect-[4/3] w-full max-w-56 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/60">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- thumbnail interno del panel, no la tienda pública
            <img src={previewSrc} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <ImageIcon className="size-6" aria-hidden="true" />
              <span className="text-xs">Sin imagen</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {previewSrc ? "Reemplazar" : "Subir imagen"}
            </button>
            {previewSrc ? (
              <button
                type="button"
                onClick={onRemove}
                aria-label="Quitar imagen de la categoría"
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
                Quitar
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG o WEBP. Máximo {MAX_CATEGORY_IMAGE_SIZE_MB} MB. Se muestra en las tarjetas de
            categoría de la tienda -- sin imagen, se usa un fondo decorativo con el color de la
            categoría.
          </p>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>

      <input
        ref={inputRef}
        id="categoryImage"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelectFile(file);
          event.target.value = "";
        }}
      />
    </FormField>
  );
}
