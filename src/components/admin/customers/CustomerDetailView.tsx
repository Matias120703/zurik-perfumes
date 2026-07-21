"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { getOrderStatusVariant } from "@/components/admin/orders/order-status";
import { useCustomer } from "@/hooks/useCustomer";
import { formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUSES } from "@/services/orders";

const DELIVERY_METHOD_LABEL = { delivery: "Delivery", pickup: "Retiro en tienda" } as const;
const PAYMENT_METHOD_LABEL = { transfer: "Transferencia bancaria", cash: "Efectivo" } as const;
const STATUS_LABEL = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s.label]));

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/30 p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  );
}

/**
 * Reutiliza `getOrderStatusVariant`/`ORDER_STATUSES` de
 * `components/admin/orders/`/`services/orders.ts` (import de solo
 * lectura -- "NO modificar Pedidos" se respeta, no se toca ningún archivo
 * de ese módulo). Cada fila del historial navega a `/admin/pedidos/[id]`
 * (Cliente → Pedido). La dirección inversa (Pedido → Cliente, desde
 * `OrderDetailView.tsx`) no se implementó este sprint: hubiera requerido
 * modificar ese componente, explícitamente fuera de alcance -- ver
 * CLAUDE.md sección 13.
 */
export function CustomerDetailView({ customerId }: { customerId: string }) {
  const { customer, isLoading, error } = useCustomer(customerId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando cliente...</p>;
  }

  if (!customer) {
    return <p className="text-sm text-destructive">{error ?? "No se encontró el cliente."}</p>;
  }

  const { stats } = customer;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.fullName}</h1>
          <p className="text-muted-foreground">Cliente desde {formatDate(customer.createdAt)}</p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/clientes" />}>
          Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Section title="Estadísticas">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard label="Total gastado" value={formatPrice(stats.totalSpent)} />
              <StatCard label="Cantidad de compras" value={String(stats.orderCount)} />
              <StatCard label="Ticket promedio" value={formatPrice(stats.averageTicket)} />
              <StatCard label="Primera compra" value={stats.firstOrderAt ? formatDate(stats.firstOrderAt) : "—"} />
              <StatCard label="Última compra" value={stats.lastOrderAt ? formatDate(stats.lastOrderAt) : "—"} />
            </div>
          </Section>

          <Section title="Historial de pedidos">
            {customer.orders.length === 0 ? (
              <EmptyState
                title="Sin pedidos todavía"
                description="Este cliente todavía no tiene ningún pedido registrado."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                      <th className="py-2 pr-4">N° Pedido</th>
                      <th className="py-2 pr-4">Fecha</th>
                      <th className="py-2 pr-4">Estado</th>
                      <th className="py-2 pr-4">Total</th>
                      <th className="py-2 pr-4">Entrega</th>
                      <th className="py-2 pr-4">Pago</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="py-3 pr-4 font-medium text-foreground">#{order.orderNumber}</td>
                        <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={getOrderStatusVariant(order.status)}>{STATUS_LABEL[order.status]}</Badge>
                        </td>
                        <td className="py-3 pr-4 font-medium text-foreground">{formatPrice(order.total)}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {DELIVERY_METHOD_LABEL[order.deliveryMethod]}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {PAYMENT_METHOD_LABEL[order.paymentMethod]}
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Ver pedido #${order.orderNumber}`}
                            nativeButton={false}
                            render={<Link href={`/admin/pedidos/${order.id}`} />}
                          >
                            <ArrowRight className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Información general">
            <div className="flex flex-col gap-2">
              <Row label="Nombre" value={customer.firstName} />
              <Row label="Apellido" value={customer.lastName} />
              <Row label="Teléfono" value={customer.phone} />
              <Row label="Email" value={customer.email ?? "—"} />
              <Row
                label="Dirección principal"
                value={customer.primaryAddress ?? "Sin dirección (siempre retiró en tienda)"}
              />
              <Row label="Fecha de registro" value={formatDate(customer.createdAt)} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
