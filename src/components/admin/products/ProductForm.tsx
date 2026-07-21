"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { ProductImagesField, type PendingImage } from "@/components/admin/products/ProductImagesField";
import { RichTextEditor } from "@/components/admin/products/RichTextEditor";
import { useCategories } from "@/hooks/useCategories";
import { useProduct } from "@/hooks/useProduct";
import { isEmptyDescriptionHtml, sanitizeDescriptionHtml } from "@/lib/sanitize-html";
import { slugify } from "@/lib/utils";
import {
  addProductImages,
  createProduct,
  deleteProductImageRows,
  updateProduct,
  type AdminProductImage,
} from "@/services/products";
import { deleteProductImageFiles, uploadProductImage } from "@/services/storage";

type ProductFormProps = { mode: "create" } | { mode: "edit"; productId: string };

type FieldErrors = Partial<
  Record<"name" | "slug" | "shortDescription" | "categoryId" | "price" | "oldPrice" | "stock", string>
>;

export function ProductForm(props: ProductFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { product, isLoading: isLoadingProduct } = useProduct(isEdit ? props.productId : "");

  /** Carpeta del bucket `product-content` para imágenes/videos que se
   * inserten en la descripción enriquecida (Sprint 6.3) -- el id real en
   * edición, o uno generado una única vez (nunca se recalcula entre
   * renders) mientras el producto todavía no existe en modo alta. */
  const [descriptionScopeId] = useState(() => (isEdit ? props.productId : crypto.randomUUID()));

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stock, setStock] = useState("");
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [keptImages, setKeptImages] = useState<AdminProductImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !product) return;
    setName(product.name);
    setSlug(product.slug);
    setSlugTouched(true);
    setShortDescription(product.shortDescription);
    setDescription(product.description ?? "");
    setCategoryId(product.categoryId);
    setPrice(String(product.price));
    setOldPrice(product.oldPrice !== null ? String(product.oldPrice) : "");
    setStock(String(product.stock));
    setFeatured(product.featured);
    setIsActive(product.isActive);
    setKeptImages(product.images);
  }, [isEdit, product]);

  useEffect(() => {
    if (!isEdit && !slugTouched && name) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched, isEdit]);

  useEffect(() => {
    return () => {
      pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al desmontar
  }, []);

  const categoryItems = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories]
  );

  function handleAddFiles(files: File[]) {
    const newImages: PendingImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingImages((current) => [...current, ...newImages]);
  }

  function handleRemovePendingImage(id: string) {
    setPendingImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== id);
    });
  }

  function handleRemoveKeptImage(imageId: string) {
    setKeptImages((current) => current.filter((image) => image.id !== imageId));
    setRemovedImageIds((current) => [...current, imageId]);
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "El nombre es obligatorio.";
    if (!slug.trim()) errors.slug = "El slug es obligatorio.";
    if (!shortDescription.trim()) errors.shortDescription = "La descripción corta es obligatoria.";
    if (!categoryId) errors.categoryId = "Elegí una categoría.";

    const priceValue = Number(price);
    if (!price.trim() || Number.isNaN(priceValue) || priceValue < 0) {
      errors.price = "Ingresá un precio válido.";
    }

    const stockValue = Number(stock);
    if (!stock.trim() || !Number.isInteger(stockValue) || stockValue < 0) {
      errors.stock = "Ingresá un stock válido (entero, 0 o más).";
    }

    if (oldPrice.trim()) {
      const oldPriceValue = Number(oldPrice);
      if (Number.isNaN(oldPriceValue) || oldPriceValue <= priceValue) {
        errors.oldPrice = "El precio anterior debe ser mayor al precio actual.";
      }
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const sanitizedDescription = sanitizeDescriptionHtml(description);
      const input = {
        categoryId,
        name: name.trim(),
        slug: slug.trim(),
        shortDescription: shortDescription.trim(),
        description: isEmptyDescriptionHtml(sanitizedDescription) ? "" : sanitizedDescription,
        price: Number(price),
        oldPrice: oldPrice.trim() ? Number(oldPrice) : null,
        stock: Number(stock),
        featured,
        isActive,
      };

      const productId = isEdit ? props.productId : await createProduct(input);
      if (isEdit) await updateProduct(productId, input);

      if (removedImageIds.length > 0) {
        const removedUrls = product?.images
          .filter((image) => removedImageIds.includes(image.id))
          .map((image) => image.url) ?? [];
        await deleteProductImageFiles(removedUrls);
        await deleteProductImageRows(removedImageIds);
      }

      if (pendingImages.length > 0) {
        let nextOrder =
          keptImages.length > 0 ? Math.max(...keptImages.map((image) => image.displayOrder)) + 1 : 0;

        const uploaded = [];
        for (const pending of pendingImages) {
          const url = await uploadProductImage(productId, pending.file);
          uploaded.push({ url, displayOrder: nextOrder, altText: input.name });
          nextOrder += 1;
        }
        await addProductImages(productId, uploaded);
      }

      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo guardar el producto.");
      setIsSubmitting(false);
    }
  }

  if (isEdit && isLoadingProduct) {
    return <p className="text-sm text-muted-foreground">Cargando producto...</p>;
  }

  if (isEdit && !isLoadingProduct && !product) {
    return <p className="text-sm text-destructive">No se encontró el producto.</p>;
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

      <FormField label="Descripción corta" htmlFor="shortDescription" required>
        <Textarea
          id="shortDescription"
          rows={2}
          value={shortDescription}
          onChange={(event) => setShortDescription(event.target.value)}
        />
        {fieldErrors.shortDescription ? (
          <p className="text-xs text-destructive">{fieldErrors.shortDescription}</p>
        ) : null}
      </FormField>

      <FormField label="Descripción completa" htmlFor="description">
        <p className="mb-2 text-xs text-muted-foreground">
          Se muestra únicamente en la página individual del producto -- no aparece en el catálogo,
          las tarjetas de producto ni la Home.
        </p>
        <RichTextEditor value={description} onChange={setDescription} scopeId={descriptionScopeId} />
      </FormField>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Categoría" htmlFor="categoryId" required>
          <Select
            items={categoryItems}
            value={categoryId}
            onValueChange={(value) => setCategoryId(value as string)}
            disabled={isLoadingCategories}
          >
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="Elegí una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.categoryId ? (
            <p className="text-xs text-destructive">{fieldErrors.categoryId}</p>
          ) : null}
        </FormField>

        <FormField label="Precio" htmlFor="price" required>
          <Input
            id="price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
          {fieldErrors.price ? <p className="text-xs text-destructive">{fieldErrors.price}</p> : null}
        </FormField>

        <FormField label="Precio anterior" htmlFor="oldPrice">
          <Input
            id="oldPrice"
            type="number"
            min={0}
            step="0.01"
            value={oldPrice}
            onChange={(event) => setOldPrice(event.target.value)}
          />
          {fieldErrors.oldPrice ? <p className="text-xs text-destructive">{fieldErrors.oldPrice}</p> : null}
        </FormField>

        <FormField label="Stock" htmlFor="stock" required>
          <Input
            id="stock"
            type="number"
            min={0}
            step="1"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
          />
          {fieldErrors.stock ? <p className="text-xs text-destructive">{fieldErrors.stock}</p> : null}
        </FormField>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
        <label htmlFor="isActive" className="flex items-center gap-3">
          <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          <span className="text-sm font-medium text-foreground">Activo</span>
        </label>

        <label htmlFor="featured" className="flex items-center gap-3">
          <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
          <span className="text-sm font-medium text-foreground">Destacado</span>
        </label>
      </div>

      <FormField label="Imágenes" htmlFor="images">
        <ProductImagesField
          keptImages={keptImages}
          onRemoveKeptImage={handleRemoveKeptImage}
          pendingImages={pendingImages}
          onAddFiles={handleAddFiles}
          onRemovePendingImage={handleRemovePendingImage}
        />
      </FormField>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/productos")}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
