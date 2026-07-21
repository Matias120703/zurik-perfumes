import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Tono del ícono -- puramente visual (Sprint 6.0.1, bug 6: "indicadores
 * con colores"), reutiliza los mismos colores semánticos que ya existían
 * en el resto del proyecto (`text-emerald-600`/`bg-amber-500`, ya usados
 * en el estado de stock de ProductCard/ProductBuyBox desde el Sprint
 * 3.2) en vez de inventar una paleta nueva. "neutral" (default) mantiene
 * el mismo aspecto de siempre -- solo las tarjetas que tiene sentido
 * destacar (ventas, pendientes, entregados) usan un tono.
 */
const TONE_CLASSES = {
  neutral: "border-border text-muted-foreground",
  positive: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-600",
} as const;

/**
 * Una tarjeta, reutilizada tanto para el "Resumen superior" (6 tarjetas)
 * como para "Ventas" (3 tarjetas) -- mismos datos, mismo componente.
 * `trend` es la "variación futura preparada, sin implementar lógica
 * todavía" que pidió el sprint: la tarjeta ya sabe mostrar una variación
 * si algún día se le pasa una, pero hoy nadie le pasa `trend` (queda
 * `undefined` en las dos secciones) -- así se evita mostrar un número
 * inventado ("no hardcodear métricas").
 */
export function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  tone = "neutral",
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: { label: string; direction: "up" | "down" };
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full border",
            TONE_CLASSES[tone]
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {trend ? (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.direction === "up" ? "text-emerald-600" : "text-destructive"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="size-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-3.5" aria-hidden="true" />
            )}
            {trend.label}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}
