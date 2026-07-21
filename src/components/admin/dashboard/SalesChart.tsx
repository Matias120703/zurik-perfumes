"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate, formatPrice } from "@/lib/utils";
import type { DashboardRecentOrder } from "@/services/dashboard";

/**
 * Gráfico de ventas (Sprint 6.0.1, bug 6) -- reutiliza `recentOrders`, el
 * mismo array que ya alimenta "Últimos pedidos" (services/dashboard.ts,
 * sin cambios: "no modificar métricas, no modificar consultas"). No es
 * una serie histórica agregada por día (esa consulta no existe y este
 * sprint no la agrega) -- es el total de cada uno de los últimos 10
 * pedidos, en orden cronológico, que es exactamente el dato ya
 * disponible. La etiqueta del gráfico lo deja explícito para no sugerir
 * más precisión de la que hay.
 */
export function SalesChart({ orders }: { orders: DashboardRecentOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay ventas"
        description="El gráfico de ventas va a aparecer apenas se registre el primer pedido."
      />
    );
  }

  const chartData = [...orders]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((order) => ({
      orderNumber: order.orderNumber,
      dateLabel: formatDate(order.createdAt),
      total: order.total,
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="orderNumber"
            tickFormatter={(value) => `#${value}`}
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatPrice(Number(value))}
            width={90}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              color: "var(--popover-foreground)",
              fontSize: 13,
            }}
            formatter={(value) => [formatPrice(Number(value)), "Total"]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload
                ? `Pedido #${payload[0].payload.orderNumber} · ${payload[0].payload.dateLabel}`
                : ""
            }
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--foreground)"
            strokeWidth={2}
            fill="url(#salesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
