"use client";

import { useRef } from "react";
import { X } from "lucide-react";

import { isRealImageUrl } from "@/lib/products";
import type { AdminProductImage } from "@/services/products";

export type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

/**
 * Administra las fotos de un producto: las que ya están guardadas
 * (`keptImages`, vienen de Storage) y las que se acaban de elegir pero
 * todavía no se subieron (`pendingImages`, previsualizadas con
 * URL.createObjectURL). No sube ni borra nada por su cuenta -- eso pasa
 * recién al guardar el formulario (ProductForm decide el orden final y
 * llama a services/storage.ts + services/products.ts). La primera imagen
 * de la lista combinada es la "imagen principal" (display_order 0).
 */
export function ProductImagesField({
  keptImages,
  onRemoveKeptImage,
  pendingImages,
  onAddFiles,
  onRemovePendingImage,
}: {
  keptImages: AdminProductImage[];
  onRemoveKeptImage: (imageId: string) => void;
  pendingImages: PendingImage[];
  onAddFiles: (files: File[]) => void;
  onRemovePendingImage: (id: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalImages = keptImages.length + pendingImages.length;

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onAddFiles(Array.from(fileList));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {keptImages.map((image, index) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/60">
            {/*
              Los 5 productos sembrados originalmente guardan rutas de
              placeholder que nunca existieron como archivo real -- mismo
              criterio que ProductCard/ProductGallery (isRealImageUrl,
              Fase 12). Sin esta guarda, la miniatura pedía esa URL y
              rompía con un 404 (auditoría, Sprint 6.0.1).
            */}
            {isRealImageUrl(image.url) ? (
              // eslint-disable-next-line @next/next/no-img-element -- thumbnail interno del panel, no de la tienda pública
              <img src={image.url} alt={image.altText ?? ""} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-lg font-semibold text-foreground/20">
                {"?"}
              </div>
            )}
            {index === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                Principal
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onRemoveKeptImage(image.id)}
              aria-label="Quitar imagen"
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {pendingImages.map((image, index) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-dashed border-border bg-muted/60">
            {/* eslint-disable-next-line @next/next/no-img-element -- preview local antes de subir, nunca se sirve en la tienda */}
            <img src={image.previewUrl} alt="" className="size-full object-cover" />
            {keptImages.length === 0 && index === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                Principal
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onRemovePendingImage(image.id)}
              aria-label="Quitar imagen"
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <span className="text-lg leading-none">+</span>
          Agregar
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(event) => handleFilesSelected(event.target.files)}
      />

      <p className="text-xs text-muted-foreground">
        {totalImages === 0
          ? "Sin imágenes todavía. La primera que agregues va a ser la imagen principal."
          : "La primera imagen de la lista es la que se muestra como principal en la tienda."}
      </p>
    </div>
  );
}
