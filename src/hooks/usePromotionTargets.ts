"use client";

import { useEffect, useState } from "react";

import { listCategories } from "@/services/categories";
import { listProducts } from "@/services/products";

export type PromotionTargetOption = { id: string; name: string };

/**
 * Trae la lista completa de productos y categorías para los selectores de
 * `PromotionForm` -- llama a `listProducts()`/`listCategories()`
 * directamente (servicios ya existentes de Productos/Categorías, import
 * de solo lectura, sin tocar esos archivos) en vez de reutilizar los
 * hooks `useProducts()`/`useCategories()`: `useProducts()` pagina de a 10
 * (Fase 10) y no expone la lista completa, así que no sirve para un
 * combo que necesita ver todos los productos. `useCategories()` sí
 * devuelve la lista completa (sin paginación real, Fase 13), pero para
 * mantener el mismo criterio en ambos combos se resuelven acá los dos,
 * en un solo hook nuevo del propio módulo de Promociones.
 */
export function usePromotionTargets() {
  const [products, setProducts] = useState<PromotionTargetOption[]>([]);
  const [categories, setCategories] = useState<PromotionTargetOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [productRows, categoryRows] = await Promise.all([listProducts(), listCategories()]);
        if (!active) return;
        setProducts(productRows.map((p) => ({ id: p.id, name: p.name })));
        setCategories(categoryRows.map((c) => ({ id: c.id, name: c.name })));
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar productos/categorías.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { products, categories, isLoading, error };
}
