"use client";

import {
  CalendarClock,
  Package,
  PackageCheck,
  Receipt,
  ShoppingCart,
  Tags,
  Users,
  Wallet,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderStatusBreakdown } from "@/components/admin/dashboard/OrderStatusBreakdown";
import { RecentOrdersTable } from "@/components/admin/dashboard/RecentOrdersTable";
import { SalesChart } from "@/components/admin/dashboard/SalesChart";
import { SummaryCard } from "@/components/admin/dashboard/SummaryCard";
import { TopProductsList } from "@/components/admin/dashboard/TopProductsList";
import { useDashboard } from "@/hooks/useDashboard";
import { formatDate, formatPrice } from "@/lib/utils";

/** `delay` en un `style` inline (no una clase Tailwind arbitraria por
 * sección) para escalonar la entrada de cada bloque -- CSS puro
 * (tw-animate-css, ya instalado para Sheet/Dialog), nunca Framer Motion:
 * el panel administrativo no usa esa librería, a propósito (CLAUDE.md,
 * sección 4) -- "únicamente en la tienda pública". */
function Section({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 duration-500 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Orquesta todo /admin: trae los datos una sola vez (useDashboard) y
 * arma las 5 secciones que pidió el sprint. Ningún sub-componente hace su
 * propia consulta a Supabase -- todos reciben los datos ya resueltos por
 * prop, mismo criterio que el resto del panel.
 */
export function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboard();

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={refetch}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Cargando dashboard...</p>;
  }

  const { summary, sales, recentOrders, topProducts, statusBreakdown } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen del negocio, calculado en el momento a partir de los datos reales de Supabase.
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-4 duration-500 animate-in fade-in slide-in-from-bottom-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        style={{ animationFillMode: "backwards" }}
      >
        <SummaryCard
          label="Total de pedidos"
          value={String(summary.totalOrders)}
          description="Pedidos registrados en total"
          icon={ShoppingCart}
        />
        <SummaryCard
          label="Pedidos pendientes"
          value={String(summary.pendingOrders)}
          description="Esperando confirmación"
          icon={Clock}
          tone="warning"
        />
        <SummaryCard
          label="Pedidos entregados"
          value={String(summary.deliveredOrders)}
          description="Completados con éxito"
          icon={PackageCheck}
          tone="positive"
        />
        <SummaryCard
          label="Total de clientes"
          value={String(summary.totalCustomers)}
          description="Compraron al menos una vez"
          icon={Users}
        />
        <SummaryCard
          label="Productos activos"
          value={String(summary.activeProducts)}
          description="Visibles en la tienda"
          icon={Package}
        />
        <SummaryCard
          label="Categorías activas"
          value={String(summary.activeCategories)}
          description="Visibles en la tienda"
          icon={Tags}
        />
      </div>

      <Section title="Ventas" delay={100}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Ventas totales"
            value={formatPrice(sales.totalSales)}
            description="Suma de todos los pedidos"
            icon={Wallet}
            tone="positive"
          />
          <SummaryCard
            label="Ticket promedio"
            value={formatPrice(sales.averageTicket)}
            description="Total de ventas / cantidad de pedidos"
            icon={Receipt}
          />
          <SummaryCard
            label="Última venta"
            value={sales.lastSaleAt ? formatDate(sales.lastSaleAt) : "—"}
            description="Fecha del pedido más reciente"
            icon={CalendarClock}
          />
        </div>

        <div className="mt-2 border-t border-border pt-6">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Ventas de los últimos {recentOrders.length} pedidos
          </h3>
          <SalesChart orders={recentOrders} />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Section title="Últimos pedidos" delay={150}>
          <RecentOrdersTable orders={recentOrders} />
        </Section>

        <Section title="Estados de pedidos" delay={200}>
          <OrderStatusBreakdown breakdown={statusBreakdown} />
        </Section>
      </div>

      <Section title="Productos más vendidos" delay={250}>
        <TopProductsList products={topProducts} />
      </Section>
    </div>
  );
}
