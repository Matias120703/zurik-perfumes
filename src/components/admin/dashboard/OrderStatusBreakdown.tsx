"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getOrderStatusVariant } from "@/components/admin/orders/order-status";
import type { DashboardStatusBreakdown } from "@/services/dashboard";

/** Mismo criterio de color que ya usaba la versión en barras de CSS puro
 * (`getOrderStatusVariant`, components/admin/orders/order-status.ts,
 * import de solo lectura -- "NO modificar Pedidos" se respeta), traducido
 * a los valores de color reales que necesita Recharts en vez de clases
 * de Tailwind. */
const BAR_COLOR: Record<ReturnType<typeof getOrderStatusVariant>, string> = {
  outline: "var(--muted-foreground)",
  secondary: "var(--secondary-foreground)",
  default: "var(--foreground)",
  destructive: "var(--destructive)",
};

/**
 * "Preparar la estructura para un gráfico futuro. No implementar gráficos
 * todavía" (Fase 17) -- ese gráfico es este, agregado en el Sprint 6.0.1
 * (bug 6). Los datos son exactamente los mismos de siempre
 * (`statusBreakdown`, services/dashboard.ts, sin cambios): un array
 * `{ status, label, count }` con los 6 estados siempre presentes.
 */
export function OrderStatusBreakdown({ breakdown }: { breakdown: DashboardStatusBreakdown[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={breakdown} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              color: "var(--popover-foreground)",
              fontSize: 13,
            }}
            formatter={(value) => [Number(value), "Pedidos"]}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {breakdown.map((item) => (
              <Cell key={item.status} fill={BAR_COLOR[getOrderStatusVariant(item.status)]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
