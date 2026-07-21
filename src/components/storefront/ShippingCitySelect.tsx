"use client";

import { useEffect, useState } from "react";

import { FormField } from "@/components/shared/FormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { siteConfig } from "@/config/site";
import type { CheckoutFieldChange } from "@/lib/checkout";
import { formatPrice } from "@/lib/utils";
import {
  getPublicCitiesByDepartment,
  getPublicDepartments,
  getShippingRateForCity,
  type PublicCity,
  type PublicDepartment,
} from "@/services/storefront/logistics";
import { useCheckoutStore } from "@/store/checkout-store";

/**
 * Reemplaza los <Input> de texto libre de departamento/ciudad por dos
 * <Select> conectados a Supabase (Sprint 6.2) -- elegir una ciudad busca
 * automáticamente su tarifa de envío y actualiza useCheckoutStore
 * directamente (mismo criterio que LocationPicker/LeafletMap con
 * lat/lng: un dato que no encaja en el `onChange` genérico de
 * CheckoutFieldChange, así que se escribe directo al store). `department`/
 * `city` (los nombres, no los IDs) se siguen escribiendo vía `onChange`
 * como cualquier otro campo del formulario -- `orders.department`/
 * `orders.city` (Fase 8) son `text`, sin ningún cambio de esquema.
 *
 * Re-deriva `departmentId`/`cityId` a partir del nombre ya guardado en el
 * store (si "Editar datos" trajo de vuelta al checkout con datos previos)
 * en cuanto llegan las listas correspondientes -- así el <Select> no
 * aparece vacío después de ese round-trip.
 */
export function ShippingCitySelect({
  department,
  city,
  disabled,
  onChange,
}: {
  department: string;
  city: string;
  disabled: boolean;
  onChange: CheckoutFieldChange;
}) {
  const t = siteConfig.checkoutPage.shippingInformation;

  const shippingChecked = useCheckoutStore((state) => state.shippingChecked);
  const shippingCost = useCheckoutStore((state) => state.shippingCost);
  const shippingEstimatedDays = useCheckoutStore((state) => state.shippingEstimatedDays);
  const setShippingResult = useCheckoutStore((state) => state.setShippingResult);
  const resetShipping = useCheckoutStore((state) => state.resetShipping);

  const [departments, setDepartments] = useState<PublicDepartment[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [cityId, setCityId] = useState("");
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLookingUpRate, setIsLookingUpRate] = useState(false);

  useEffect(() => {
    getPublicDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (!department || departmentId) return;
    const match = departments.find((d) => d.name === department);
    if (match) setDepartmentId(match.id);
  }, [department, departments, departmentId]);

  useEffect(() => {
    if (!departmentId) {
      setCities([]);
      return;
    }
    setIsLoadingCities(true);
    getPublicCitiesByDepartment(departmentId)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setIsLoadingCities(false));
  }, [departmentId]);

  useEffect(() => {
    if (!city || cityId || cities.length === 0) return;
    const match = cities.find((c) => c.name === city);
    if (match) setCityId(match.id);
  }, [city, cities, cityId]);

  function handleDepartmentChange(nextId: string) {
    setDepartmentId(nextId);
    setCityId("");
    onChange("department", departments.find((d) => d.id === nextId)?.name ?? "");
    onChange("city", "");
    resetShipping();
  }

  function handleCityChange(nextId: string) {
    setCityId(nextId);
    onChange("city", cities.find((c) => c.id === nextId)?.name ?? "");
    resetShipping();

    setIsLookingUpRate(true);
    getShippingRateForCity(nextId)
      .then((rate) =>
        setShippingResult({
          rateId: rate?.id ?? null,
          rateName: rate?.name ?? null,
          cost: rate?.price ?? null,
          estimatedDays: rate?.estimatedDays ?? null,
        })
      )
      .catch(() =>
        setShippingResult({ rateId: null, rateName: null, cost: null, estimatedDays: null })
      )
      .finally(() => setIsLookingUpRate(false));
  }

  const departmentItems = departments.map((d) => ({ value: d.id, label: d.name }));
  const cityItems = cities.map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <FormField label={t.departmentLabel} htmlFor="department" required={!disabled}>
        <Select
          items={departmentItems}
          value={departmentId}
          onValueChange={(value) => handleDepartmentChange(value as string)}
          disabled={disabled}
        >
          <SelectTrigger id="department" className="w-full">
            <SelectValue placeholder={t.departmentPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dep) => (
              <SelectItem key={dep.id} value={dep.id}>
                {dep.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={t.cityLabel} htmlFor="city" required={!disabled}>
        <Select
          items={cityItems}
          value={cityId}
          onValueChange={(value) => handleCityChange(value as string)}
          disabled={disabled || !departmentId || isLoadingCities}
        >
          <SelectTrigger id="city" className="w-full">
            <SelectValue placeholder={t.cityPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {!disabled && shippingChecked ? (
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3 text-sm sm:col-span-2">
          {isLookingUpRate ? (
            <span className="text-muted-foreground">{t.shippingCostLoading}</span>
          ) : shippingCost !== null ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.shippingCostLabel}</span>
                <span className="font-medium text-foreground">{formatPrice(shippingCost)}</span>
              </div>
              {shippingEstimatedDays ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.shippingEstimatedDaysLabel}</span>
                  <span className="font-medium text-foreground">{shippingEstimatedDays}</span>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.shippingCostLabel}</span>
                <span className="font-medium text-foreground">{t.shippingCostToConfirm}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.shippingCostToConfirmHint}</p>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
