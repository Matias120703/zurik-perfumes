"use client";

import { useEffect, useState } from "react";

import {
  listCitiesByDepartment,
  listDepartments,
  type AdminCity,
  type AdminDepartment,
} from "@/services/logistics";

/** Lista completa de departamentos -- se carga una única vez, no depende de
 * ningún otro estado (18 filas, sin necesidad de paginar ni buscar). */
export function useDepartments() {
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listDepartments()
      .then((data) => {
        if (active) setDepartments(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los departamentos.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { departments, isLoading, error };
}

/** Ciudades del departamento elegido -- se refetchea cada vez que cambia
 * `departmentId` (usado por DepartmentCityPicker, Sprint 6.2). Con
 * `departmentId` vacío no consulta nada, mismo criterio que useCategory("")
 * en modo creación. */
export function useCitiesByDepartment(departmentId: string) {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!departmentId) {
      setCities([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    listCitiesByDepartment(departmentId)
      .then((data) => {
        if (active) setCities(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar las ciudades.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [departmentId]);

  return { cities, isLoading, error };
}
