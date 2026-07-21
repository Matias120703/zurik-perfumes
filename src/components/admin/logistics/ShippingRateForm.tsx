"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { DepartmentCityPicker } from "@/components/admin/logistics/DepartmentCityPicker";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useDepartments } from "@/hooks/useDepartmentsAndCities";
import { useShippingRate } from "@/hooks/useShippingRate";
import {
  createShippingRate,
  getCitiesByIds,
  updateShippingRate,
} from "@/services/logistics";

type ShippingRateFormProps = { mode: "create" } | { mode: "edit"; rateId: string };

type FieldErrors = Partial<Record<"name" | "price" | "cityIds", string>>;

/**
 * Mismo patrón que CategoryForm/ProductForm: un solo componente decide alta
 * o edición según si recibe `rateId`. `departmentId` es estado propio de
 * este formulario (no de `ShippingRateFormInput`, que solo necesita
 * `cityIds`) -- existe únicamente para que DepartmentCityPicker sepa qué
 * ciudades mostrar; el departamento en sí no se guarda en ningún lado
 * (Sprint 6.2, ver services/logistics.ts).
 */
export function ShippingRateForm(props: ShippingRateFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const { rate, isLoading: isLoadingRate } = useShippingRate(isEdit ? props.rateId : "");
  // Se pide acá (no dentro de DepartmentCityPicker) para que el fetch
  // arranque desde el primer render del formulario, en paralelo con
  // useShippingRate -- si se pidiera recién adentro del picker, en modo
  // edición arrancaría tarde (el picker no se monta hasta que se resuelve
  // el departamento derivado más abajo) y el <Select> mostraría el UUID
  // crudo en vez del nombre la primera vez que tiene un valor.
  const { departments, isLoading: isLoadingDepartments } = useDepartments();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [departmentId, setDepartmentId] = useState("");
  const [cityIds, setCityIds] = useState<string[]>([]);
  const [isLoadingDepartment, setIsLoadingDepartment] = useState(isEdit);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !rate) return;
    setName(rate.name);
    setPrice(String(rate.price));
    setEstimatedDays(rate.estimatedDays ?? "");
    setIsActive(rate.isActive);
    setCityIds(rate.cityIds);

    // Todas las ciudades ya asignadas comparten el mismo departamento
    // (restricción de UI, ver DepartmentCityPicker) -- alcanza con mirar
    // la primera para preseleccionarlo. `isLoadingDepartment` evita mostrar
    // el picker con el departamento todavía en blanco mientras se resuelve
    // este segundo round-trip (encadenado después del que ya trae `rate`).
    getCitiesByIds(rate.cityIds)
      .then((cities) => setDepartmentId(cities[0]?.departmentId ?? ""))
      .finally(() => setIsLoadingDepartment(false));
  }, [isEdit, rate]);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "El nombre es obligatorio.";
    const numericPrice = Number(price);
    if (!price.trim() || Number.isNaN(numericPrice) || numericPrice < 0) {
      errors.price = "Ingresá un precio válido.";
    }
    if (cityIds.length === 0) {
      errors.cityIds = "Elegí al menos una ciudad para esta tarifa.";
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
      const input = {
        name: name.trim(),
        price: Number(price),
        estimatedDays: estimatedDays.trim(),
        isActive,
        cityIds,
      };

      if (isEdit) {
        await updateShippingRate(props.rateId, input);
      } else {
        await createShippingRate(input);
      }

      router.push("/admin/logistica");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo guardar la tarifa de envío.");
      setIsSubmitting(false);
    }
  }

  if (isEdit && (isLoadingRate || isLoadingDepartment || isLoadingDepartments)) {
    return <p className="text-sm text-muted-foreground">Cargando tarifa de envío...</p>;
  }

  if (isEdit && !isLoadingRate && !rate) {
    return <p className="text-sm text-destructive">No se encontró la tarifa de envío.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <FormField
          label="Nombre"
          htmlFor="name"
          required
          className={fieldErrors.name ? "sm:col-span-2 text-destructive" : "sm:col-span-2"}
        >
          <Input
            id="name"
            placeholder="Envío a Central"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : null}
        </FormField>

        <FormField label="Precio" htmlFor="price" required>
          <Input
            id="price"
            type="number"
            min={0}
            step="1"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
          {fieldErrors.price ? <p className="text-xs text-destructive">{fieldErrors.price}</p> : null}
        </FormField>
      </div>

      <FormField label="Tiempo estimado" htmlFor="estimatedDays">
        <Input
          id="estimatedDays"
          placeholder="24 hs, 48 hs, 3-5 días..."
          value={estimatedDays}
          onChange={(event) => setEstimatedDays(event.target.value)}
        />
      </FormField>

      <label htmlFor="isActive" className="flex items-center gap-3">
        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
        <span className="text-sm font-medium text-foreground">Activa</span>
      </label>

      <div className="flex flex-col gap-2 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-foreground">Cobertura</h2>
        <DepartmentCityPicker
          departments={departments}
          isLoadingDepartments={isLoadingDepartments}
          departmentId={departmentId}
          onDepartmentIdChange={setDepartmentId}
          selectedCityIds={cityIds}
          onSelectedCityIdsChange={setCityIds}
        />
        {fieldErrors.cityIds ? (
          <p className="text-xs text-destructive">{fieldErrors.cityIds}</p>
        ) : null}
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/logistica")}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear tarifa"}
        </Button>
      </div>
    </form>
  );
}
