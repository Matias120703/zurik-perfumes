"use client";

import { useCallback, useEffect, useState } from "react";

import type { Product } from "@/config/products";

/** "Debe dar tiempo suficiente para observar cada producto" -- valor
 * pedido explícitamente por el sprint. */
const AUTO_ADVANCE_MS = 1500;

/**
 * Estado del carrusel del Showcase (Sprint 6.3): índice actual, dirección
 * (para la transición de Framer Motion) y pausa en hover. Primer hook
 * propio de la tienda pública -- hasta ahora "la tienda pública sigue sin
 * custom hooks propios" (CLAUDE.md sección 11) porque ningún componente
 * fetcheaba sus propios datos; este no es la excepción a esa regla, sigue
 * sin pedirle nada a Supabase -- `products` ya viene resuelto por la
 * página (Home, vía `getPublicHeroProducts()`) y se recibe por parámetro.
 * Lo que este hook encapsula es la lógica de *presentación* (qué índice
 * mostrar, cuándo avanzar solo, en qué dirección), separada de
 * `ProductShowcase.tsx` para que el componente se quede puramente
 * presentacional -- mismo espíritu que separa `lib/search.ts` de
 * `CatalogResults.tsx`.
 *
 * Mismo patrón que `PromotionCarousel` (Sprint 6.1, `PromotionalBanner.tsx`):
 * el temporizador depende de `index`, así que se reinicia solo con
 * cualquier cambio de slide -- automático o manual -- sin código aparte
 * para "reiniciar el temporizador".
 */
export function useProductShowcase(products: Product[]) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (nextIndex: number, nextDirection: number) => {
      if (products.length === 0) return;
      setDirection(nextDirection);
      setIndex((nextIndex + products.length) % products.length);
    },
    [products.length]
  );

  const goNext = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  useEffect(() => {
    if (paused || products.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % products.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused, products.length, index]);

  return {
    current: products[index] ?? null,
    index,
    direction,
    total: products.length,
    goNext,
    goPrev,
    goTo,
    setPaused,
  };
}
