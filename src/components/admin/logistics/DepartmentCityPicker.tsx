"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCitiesByDepartment } from "@/hooks/useDepartmentsAndCities";
import type { AdminDepartment } from "@/services/logistics";

/**
 * "Interfaz cómoda" pedida por el sprint para elegir decenas de ciudades
 * rápido, en vez de un <Select> común: un departamento a la vez -- una
 * tarifa cubre ciudades de un único departamento, restricción solo de este
 * formulario, no de la base (`shipping_rate_cities` no tiene ninguna
 * columna de departamento, así que un sprint futuro podría relajar esto
 * sin ninguna migración) --, buscador de ciudades, checkboxes, y
 * "seleccionar todas"/"deseleccionar todas" sobre lo que esté visible
 * según el buscador.
 *
 * `departmentId`/`selectedCityIds` son props controladas por
 * ShippingRateForm (mismo patrón que el resto de los campos del
 * formulario) -- este componente nunca guarda su propia copia de esos dos
 * valores, solo el texto del buscador de ciudades, que es puramente de UI.
 *
 * `departments`/`isLoadingDepartments` también se reciben por prop en vez
 * de pedirse acá con `useDepartments()`: ese fetch necesita arrancar desde
 * el primer render de ShippingRateForm (en paralelo con la tarifa), no
 * recién cuando este componente se monta -- en modo edición, el picker no
 * se monta hasta resolver a qué departamento pertenecen las ciudades ya
 * asignadas, así que pedirlo acá lo dejaría siempre un paso atrás.
 */
export function DepartmentCityPicker({
  departments,
  isLoadingDepartments,
  departmentId,
  onDepartmentIdChange,
  selectedCityIds,
  onSelectedCityIdsChange,
  disabled,
}: {
  departments: AdminDepartment[];
  isLoadingDepartments: boolean;
  departmentId: string;
  onDepartmentIdChange: (id: string) => void;
  selectedCityIds: string[];
  onSelectedCityIdsChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const { cities, isLoading: isLoadingCities } = useCitiesByDepartment(departmentId);
  const [cityQuery, setCityQuery] = useState("");

  const visibleCities = cityQuery.trim()
    ? cities.filter((city) => city.name.toLowerCase().includes(cityQuery.trim().toLowerCase()))
    : cities;

  const selectedSet = new Set(selectedCityIds);

  /** Cambiar de departamento vacía la selección de ciudades -- una tarifa
   * cubre ciudades de un único departamento (ver comentario de arriba).
   * Solo se dispara por una interacción real con el <Select>, nunca por
   * la precarga inicial en modo edición (que setea `departmentId`/
   * `selectedCityIds` directamente desde ShippingRateForm, sin pasar por
   * este handler). */
  function handleDepartmentChange(nextId: string) {
    onDepartmentIdChange(nextId);
    onSelectedCityIdsChange([]);
    setCityQuery("");
  }

  function toggleCity(cityId: string, checked: boolean) {
    if (checked) {
      onSelectedCityIdsChange([...selectedCityIds, cityId]);
    } else {
      onSelectedCityIdsChange(selectedCityIds.filter((id) => id !== cityId));
    }
  }

  function selectAllVisible() {
    const merged = new Set([...selectedCityIds, ...visibleCities.map((c) => c.id)]);
    onSelectedCityIdsChange([...merged]);
  }

  function deselectAllVisible() {
    const visibleIds = new Set(visibleCities.map((c) => c.id));
    onSelectedCityIdsChange(selectedCityIds.filter((id) => !visibleIds.has(id)));
  }

  const departmentItems = departments.map((d) => ({ value: d.id, label: d.name }));

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Departamento" htmlFor="departmentId" required={!disabled}>
        <Select
          items={departmentItems}
          value={departmentId}
          onValueChange={(value) => handleDepartmentChange(value as string)}
          disabled={disabled || isLoadingDepartments}
        >
          <SelectTrigger id="departmentId" className="w-full">
            <SelectValue placeholder="Elegí un departamento" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {departmentId ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ciudad..."
                aria-label="Buscar ciudad"
                value={cityQuery}
                onChange={(event) => setCityQuery(event.target.value)}
                disabled={disabled}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllVisible}
                disabled={disabled || visibleCities.length === 0}
              >
                Seleccionar todas
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={deselectAllVisible}
                disabled={disabled || visibleCities.length === 0}
              >
                Deseleccionar todas
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {selectedCityIds.length} ciudad{selectedCityIds.length === 1 ? "" : "es"} seleccionada
            {selectedCityIds.length === 1 ? "" : "s"}
          </p>

          {isLoadingCities ? (
            <p className="text-sm text-muted-foreground">Cargando ciudades...</p>
          ) : visibleCities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No encontramos ciudades para tu búsqueda.</p>
          ) : (
            <div className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {visibleCities.map((city) => (
                <label
                  key={city.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted/60"
                >
                  <Checkbox
                    checked={selectedSet.has(city.id)}
                    onCheckedChange={(checked) => toggleCity(city.id, checked === true)}
                    disabled={disabled}
                  />
                  {city.name}
                </label>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
