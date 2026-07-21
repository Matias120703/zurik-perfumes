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
import { usePromotion } from "@/hooks/usePromotion";
import { usePromotionTargets } from "@/hooks/usePromotionTargets";
import type { DiscountType } from "@/lib/promotions";
import { createPromotion, updatePromotion, type PromotionFormInput } from "@/services/promotions";

const DISCOUNT_TYPE_OPTIONS: { value: DiscountType; label: string }[] = [
  { value: "percentage", label: "Porcentaje (%)" },
  { value: "fixed_amount", label: "Monto fijo (Gs.)" },
];

type TargetType = "category" | "product";

type PromotionFormProps = { mode: "create" } | { mode: "edit"; promotionId: string };

type FieldErrors = Partial<
  Record<"title" | "discountValue" | "target" | "startsAt" | "endsAt", string>
>;

/** Convierte un ISO (lo que guarda Supabase) a lo que espera un
 * <input type="datetime-local">, en hora local del navegador -- y de
 * vuelta. Solo lo usa este formulario, por eso no se extrajo a lib/. */
function isoToDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function datetimeLocalToIso(value: string): string {
  return new Date(value).toISOString();
}

export function PromotionForm(props: PromotionFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const { promotion, isLoading: isLoadingPromotion } = usePromotion(isEdit ? props.promotionId : "");
  const { products, categories, isLoading: isLoadingTargets } = usePromotionTargets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [targetType, setTargetType] = useState<TargetType>("category");
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !promotion) return;
    setTitle(promotion.title);
    setDescription(promotion.description ?? "");
    setDiscountType(promotion.discountType);
    setDiscountValue(String(promotion.discountValue));
    setStartsAt(isoToDatetimeLocal(promotion.startsAt));
    setEndsAt(isoToDatetimeLocal(promotion.endsAt));
    setIsActive(promotion.isActive);
    setTargetType(promotion.productId ? "product" : "category");
    setCategoryId(promotion.categoryId ?? "");
    setProductId(promotion.productId ?? "");
  }, [isEdit, promotion]);

  const categoryItems = categories.map((category) => ({ value: category.id, label: category.name }));
  const productItems = products.map((product) => ({ value: product.id, label: product.name }));

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!title.trim()) errors.title = "El título es obligatorio.";

    const discountValueNumber = Number(discountValue);
    if (!discountValue.trim() || Number.isNaN(discountValueNumber) || discountValueNumber <= 0) {
      errors.discountValue = "Ingresá un valor de descuento válido, mayor a 0.";
    } else if (discountType === "percentage" && discountValueNumber > 100) {
      errors.discountValue = "Un descuento porcentual no puede ser mayor a 100.";
    }

    if (targetType === "category" && !categoryId) errors.target = "Elegí una categoría.";
    if (targetType === "product" && !productId) errors.target = "Elegí un producto.";

    if (!startsAt) errors.startsAt = "La fecha de inicio es obligatoria.";
    if (!endsAt) errors.endsAt = "La fecha de fin es obligatoria.";
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      errors.endsAt = "La fecha de fin debe ser posterior a la fecha de inicio.";
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
      const input: PromotionFormInput = {
        title: title.trim(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        categoryId: targetType === "category" ? categoryId : null,
        productId: targetType === "product" ? productId : null,
        startsAt: datetimeLocalToIso(startsAt),
        endsAt: datetimeLocalToIso(endsAt),
        isActive,
      };

      if (isEdit) {
        await updatePromotion(props.promotionId, input);
      } else {
        await createPromotion(input);
      }

      router.push("/admin/promociones");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo guardar la promoción.");
      setIsSubmitting(false);
    }
  }

  if (isEdit && isLoadingPromotion) {
    return <p className="text-sm text-muted-foreground">Cargando promoción...</p>;
  }

  if (isEdit && !isLoadingPromotion && !promotion) {
    return <p className="text-sm text-destructive">No se encontró la promoción.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FormField label="Título" htmlFor="title" required>
          <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
          {fieldErrors.title ? <p className="text-xs text-destructive">{fieldErrors.title}</p> : null}
        </FormField>

        <FormField label="Tipo de descuento" htmlFor="discountType" required>
          <Select
            items={DISCOUNT_TYPE_OPTIONS}
            value={discountType}
            onValueChange={(value) => setDiscountType(value as DiscountType)}
          >
            <SelectTrigger id="discountType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISCOUNT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          label={discountType === "percentage" ? "Valor (%)" : "Valor (Gs.)"}
          htmlFor="discountValue"
          required
        >
          <Input
            id="discountValue"
            type="number"
            min={0}
            step="0.01"
            value={discountValue}
            onChange={(event) => setDiscountValue(event.target.value)}
          />
          {fieldErrors.discountValue ? (
            <p className="text-xs text-destructive">{fieldErrors.discountValue}</p>
          ) : null}
        </FormField>

        <label htmlFor="isActive" className="flex items-center gap-3 self-end pb-2">
          <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          <span className="text-sm font-medium text-foreground">Activa</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label="Fecha inicio" htmlFor="startsAt" required>
          <Input
            id="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          {fieldErrors.startsAt ? <p className="text-xs text-destructive">{fieldErrors.startsAt}</p> : null}
        </FormField>

        <FormField label="Fecha fin" htmlFor="endsAt" required>
          <Input
            id="endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
          {fieldErrors.endsAt ? <p className="text-xs text-destructive">{fieldErrors.endsAt}</p> : null}
        </FormField>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground">¿A qué aplica esta promoción?</span>
          <span className="text-xs text-muted-foreground">
            Elegí exactamente una: un producto específico o una categoría completa, nunca ambas.
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="targetType"
              checked={targetType === "category"}
              onChange={() => {
                setTargetType("category");
                setProductId("");
              }}
            />
            Una categoría completa
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="targetType"
              checked={targetType === "product"}
              onChange={() => {
                setTargetType("product");
                setCategoryId("");
              }}
            />
            Un producto específico
          </label>
        </div>

        {targetType === "category" ? (
          <FormField label="Categoría" htmlFor="categoryId" required>
            <Select
              items={categoryItems}
              value={categoryId}
              onValueChange={(value) => setCategoryId(value as string)}
              disabled={isLoadingTargets}
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
          </FormField>
        ) : (
          <FormField label="Producto" htmlFor="productId" required>
            <Select
              items={productItems}
              value={productId}
              onValueChange={(value) => setProductId(value as string)}
              disabled={isLoadingTargets}
            >
              <SelectTrigger id="productId" className="w-full">
                <SelectValue placeholder="Elegí un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
        {fieldErrors.target ? <p className="text-xs text-destructive">{fieldErrors.target}</p> : null}
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/promociones")}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear promoción"}
        </Button>
      </div>
    </form>
  );
}
