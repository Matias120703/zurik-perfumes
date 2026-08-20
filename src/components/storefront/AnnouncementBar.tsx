"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

const ROTATION_MS = 4000;

/**
 * Franja superior de anuncios: lo primero que ve alguien que entra a la
 * tienda. Rota entre los mensajes cargados en /admin/contenido.
 *
 * No se renderiza si está apagada o si no hay ningún mensaje -- nunca
 * deja una barra vacía ocupando el lugar más valioso de la página.
 *
 * El temporizador depende de `index`, así que se reinicia solo con cada
 * cambio -- mismo patrón ya usado por `PromotionCarousel` y
 * `useProductShowcase`, sin código aparte para "reiniciar el timer".
 */
export function AnnouncementBar({
  enabled,
  messages,
}: {
  enabled: boolean;
  messages: string[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const total = messages.length;

  useEffect(() => {
    if (total <= 1) return;
    const timer = setTimeout(() => setIndex((current) => (current + 1) % total), ROTATION_MS);
    return () => clearTimeout(timer);
  }, [index, total]);

  if (!enabled || total === 0) return null;

  return (
    // Barra dorada con texto oscuro: es lo primero que se ve al entrar y
    // marca el código de color de toda la tienda (negro + dorado) antes
    // incluso de que cargue la primera foto.
    <div className="relative overflow-hidden bg-gradient-to-r from-[var(--gold-deep)] via-[var(--gold)] to-[var(--gold-deep)]">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-6">
        <Sparkles
          className="size-3.5 shrink-0 text-[var(--gold-foreground)]/70"
          aria-hidden="true"
        />

        {/*
          `aria-live="polite"` para que un lector de pantalla anuncie el
          mensaje nuevo sin interrumpir lo que la persona esté leyendo --
          es información promocional, no urgente.
        */}
        <div className="relative h-9 flex-1 overflow-hidden" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={index}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: shouldReduceMotion ? 0.15 : 0.35, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center truncate text-center text-[11px] font-semibold tracking-wide text-[var(--gold-foreground)] sm:text-xs"
            >
              {messages[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        <Sparkles
          className="size-3.5 shrink-0 text-[var(--gold-foreground)]/70"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
