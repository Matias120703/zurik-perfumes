"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_ICON_OPTIONS } from "@/components/admin/categories/category-icons";
import { CategoryImageField, type PendingCategoryImage } from "@/components/admin/categories/CategoryImageField";
import { useCategory } from "@/hooks/useCategory";
import { slugify } from "@/lib/utils";
import {
  ALLOWED_CATEGORY_IMAGE_TYPES,
  MAX_CATEGORY_IMAGE_SIZE_BYTES,
  MAX_CATEGORY_IMAGE_SIZE_MB,
  createCategory,
  isSlugTaken,
  updateCategory,
} from "@/services/categories";
import { deleteCategoryImageFile, uploadCategoryImage } from "@/services/storage";

type CategoryFormProps = { mode: "create" } | { mode: "edit"; categoryId: string };

type FieldErrors = Partial<Record<"name" | "slug", string>>;

const DEFAULT_COLOR = "#6B7280";

/**
 * Mismo patrón que ProductForm (Fase 10): un solo componente decide alta o
 * edición según si recibe `categoryId`, slug autogenerado del nombre hasta
 * que se edita a mano. Desde el Sprint 6.6, gestiona también la imagen de
 * la categoría -- mismo patrón de "no subir nada hasta guardar" que
 * `SettingsForm.tsx` con Logo/Favicon (`pendingImage`/`removeImage`,
 * resueltos recién en `handleSubmit`).
 */
export function CategoryForm(props: CategoryFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const { category, isLoading: isLoadingCategory } = useCategory(isEdit ? props.categoryId : "");

  /** Carpeta del bucket `category-images` -- el id real en edición, o uno
   * generado una única vez (nunca se recalcula entre renders) mientras la
   * categoría todavía no existe en modo alta -- mismo criterio que
   * `descriptionScopeId` en `ProductForm.tsx`. */
  const [imageScopeId] = useState(() => (isEdit ? props.categoryId : crypto.randomUUID()));

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingCategoryImage>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState(DEFAULT_COLOR);
  const [iconName, setIconName] = useState(CATEGORY_ICON_OPTIONS[0].value);
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !category) return;
    setName(category.name);
    setSlug(category.slug);
    setSlugTouched(true);
    setDescription(category.description);
    setImageUrl(category.imageUrl);
    setAccentColor(category.accentColor ?? DEFAULT_COLOR);
    setIconName(category.iconName);
    setDisplayOrder(String(category.displayOrder));
    setIsActive(category.isActive);
  }, [isEdit, category]);

  useEffect(() => {
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al desmontar
  }, []);

  function handleSelectImage(file: File) {
    if (!ALLOWED_CATEGORY_IMAGE_TYPES.includes(file.type)) {
      setImageError("Formato no admitido. Usá PNG, JPG o WEBP.");
      return;
    }
    if (file.size > MAX_CATEGORY_IMAGE_SIZE_BYTES) {
      setImageError(`El archivo supera el límite de ${MAX_CATEGORY_IMAGE_SIZE_MB} MB.`);
      return;
    }
    setImageError(null);
    setRemoveImage(false);
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  function handleRemoveImage() {
    setImageError(null);
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
    setRemoveImage(true);
  }

  useEffect(() => {
    if (!isEdit && !slugTouched && name) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched, isEdit]);

  async function validate(): Promise<FieldErrors> {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "El nombre es obligatorio.";
    if (!slug.trim()) {
      errors.slug = "El slug es obligatorio.";
    } else if (await isSlugTaken(slug.trim(), isEdit ? props.categoryId : undefined)) {
      errors.slug = "Ya existe otra categoría con ese slug.";
    }
    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const errors = await validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      /**
       * Mismo orden que `SettingsForm.tsx` con Logo/Favicon: si hay un
       * archivo pendiente, subirlo primero y recién después borrar el
       * anterior (si había uno) -- nunca al revés, para no quedarse sin
       * ninguna imagen si la subida fallara a mitad de camino.
       */
      let resolvedImageUrl = removeImage ? null : imageUrl;
      if (pendingImage) {
        resolvedImageUrl = await uploadCategoryImage(imageScopeId, pendingImage.file);
        if (imageUrl) await deleteCategoryImageFile(imageUrl);
      } else if (removeImage && imageUrl) {
        await deleteCategoryImageFile(imageUrl);
      }

      const input = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        imageUrl: resolvedImageUrl,
        accentColor,
        iconName,
        displayOrder: Number(displayOrder) || 0,
        isActive,
      };

      if (isEdit) {
        await updateCategory(props.categoryId, input);
      } else {
        await createCategory(input);
      }

      router.push("/admin/categorias");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo guardar la categoría.");
      setIsSubmitting(false);
    }
  }

  if (isEdit && isLoadingCategory) {
    return <p className="text-sm text-muted-foreground">Cargando categoría...</p>;
  }

  if (isEdit && !isLoadingCategory && !category) {
    return <p className="text-sm text-destructive">No se encontró la categoría.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FormField label="Nombre" htmlFor="name" required className={fieldErrors.name ? "text-destructive" : undefined}>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : null}
        </FormField>

        <FormField label="Slug" htmlFor="slug" required>
          <Input
            id="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
          />
          {fieldErrors.slug ? <p className="text-xs text-destructive">{fieldErrors.slug}</p> : null}
        </FormField>
      </div>

      <FormField label="Descripción" htmlFor="description">
        <Textarea
          id="description"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </FormField>

      <CategoryImageField
        currentUrl={removeImage ? null : imageUrl}
        pending={pendingImage}
        error={imageError}
        onSelectFile={handleSelectImage}
        onRemove={handleRemoveImage}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <FormField label="Color" htmlFor="accentColor">
          <div className="flex items-center gap-2">
            <input
              id="accentColor"
              type="color"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
            />
            <Input
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              aria-label="Color en hexadecimal"
              className="flex-1"
            />
          </div>
        </FormField>

        <FormField label="Ícono" htmlFor="iconName">
          <Select
            items={CATEGORY_ICON_OPTIONS}
            value={iconName}
            onValueChange={(value) => setIconName(value as string)}
          >
            <SelectTrigger id="iconName" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_ICON_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <option.icon className="size-4" aria-hidden="true" />
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Orden de visualización" htmlFor="displayOrder">
          <Input
            id="displayOrder"
            type="number"
            min={0}
            step="1"
            value={displayOrder}
            onChange={(event) => setDisplayOrder(event.target.value)}
          />
        </FormField>
      </div>

      <label htmlFor="isActive" className="flex items-center gap-3">
        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
        <span className="text-sm font-medium text-foreground">Activa</span>
      </label>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/categorias")}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear categoría"}
        </Button>
      </div>
    </form>
  );
}
