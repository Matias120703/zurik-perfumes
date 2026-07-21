"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderStatusSelect } from "@/components/admin/orders/OrderStatusSelect";
import { useOrder } from "@/hooks/useOrder";
import { formatDate, formatPrice, getGoogleMapsUrl } from "@/lib/utils";

const DELIVERY_METHOD_LABEL = { delivery: "Delivery", pickup: "Retiro en tienda" } as const;
const PAYMENT_METHOD_LABEL = { transfer: "Transferencia bancaria", cash: "Efectivo" } as const;

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

export function OrderDetailView({ orderId }: { orderId: string }) {
  const { order, isLoading, error, isUpdatingStatus, changeStatus } = useOrder(orderId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando pedido...</p>;
  }

  if (!order) {
    return <p className="text-sm text-destructive">{error ?? "No se encontró el pedido."}</p>;
  }

  const isDelivery = order.deliveryMethod === "delivery";
  const hasLocation = order.latitude !== null && order.longitude !== null;
  const mapsHref = hasLocation
    ? getGoogleMapsUrl("", { lat: order.latitude!, lng: order.longitude! })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Pedido #{order.orderNumber}
            </h1>
          </div>
          <p className="text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>

        <div className="flex items-center gap-3">
          <OrderStatusSelect status={order.status} onStatusChange={changeStatus} disabled={isUpdatingStatus} />
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/pedidos" />}>
            Volver
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Section title="Cliente">
            <div className="flex flex-col gap-2">
              <Row label="Nombre" value={order.customerName} />
              <Row label="Teléfono" value={order.customerPhone} />
              {order.customerEmail ? <Row label="Email" value={order.customerEmail} /> : null}
            </div>
          </Section>

          <Section title="Productos">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                    <th className="py-2 pr-4">Producto</th>
                    <th className="py-2 pr-4">Cantidad</th>
                    <th className="py-2 pr-4">Precio unitario</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{item.productName}</td>
                      <td className="py-3 pr-4 text-foreground">{item.quantity}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{formatPrice(item.unitPrice)}</td>
                      <td className="py-3 text-right font-medium text-foreground">
                        {formatPrice(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {/*
                Sprint 6.2: con Delivery, un `shippingCost` null significa
                que la ciudad elegida no tenía ninguna tarifa configurada
                -- se muestra "A confirmar" en vez de ocultar la fila, para
                que el administrador vea de inmediato que tiene que
                informar el costo manualmente. Con Retiro en tienda no
                aplica ningún envío, esa fila no se muestra.
              */}
              {order.deliveryMethod === "delivery" ? (
                <Row
                  label="Envío"
                  value={
                    order.shippingCost !== null ? (
                      formatPrice(order.shippingCost)
                    ) : (
                      <span className="text-amber-600 dark:text-amber-500">A confirmar</span>
                    )
                  }
                />
              ) : null}
              {order.shippingRateName ? (
                <Row label="Tarifa usada" value={order.shippingRateName} />
              ) : null}
              <div className="flex items-center justify-between gap-4 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </Section>

          {order.notes ? (
            <Section title="Notas">
              <p className="text-sm whitespace-pre-wrap text-foreground">{order.notes}</p>
            </Section>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Entrega">
            <div className="flex flex-col gap-2">
              <Row label="Método" value={DELIVERY_METHOD_LABEL[order.deliveryMethod]} />
              {isDelivery ? (
                <>
                  <Row label="Departamento" value={order.department ?? "—"} />
                  <Row label="Ciudad" value={order.city ?? "—"} />
                  <Row label="Barrio" value={order.neighborhood ?? "—"} />
                  <Row label="Dirección" value={order.address ?? "—"} />
                  {order.reference ? <Row label="Referencia" value={order.reference} /> : null}
                </>
              ) : null}
            </div>

            {hasLocation && mapsHref ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                nativeButton={false}
                render={<a href={mapsHref} target="_blank" rel="noopener noreferrer" />}
              >
                <MapPin className="size-4" />
                Ver ubicación en el mapa
              </Button>
            ) : null}
          </Section>

          <Section title="Pago">
            <p className="text-sm font-medium text-foreground">
              {PAYMENT_METHOD_LABEL[order.paymentMethod]}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
