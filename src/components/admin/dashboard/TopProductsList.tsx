import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatPrice } from "@/lib/utils";
import type { DashboardTopProduct } from "@/services/dashboard";

/** Los 3 primeros puestos se destacan con el mismo tono neutro que ya usa
 * el resto del panel (sin inventar una paleta nueva) -- puramente visual,
 * Sprint 6.0.1 (bug 6). */
const RANK_BADGE = [
  "bg-foreground text-background",
  "bg-foreground/80 text-background",
  "bg-foreground/60 text-background",
] as const;

/** Calculado dinámicamente a partir de order_items (services/dashboard.ts)
 * -- nada de esto se guarda. Sin navegación al producto: no la pidió el
 * sprint para esta sección (a diferencia de "Últimos pedidos", que sí la
 * pide explícitamente). */
export function TopProductsList({ products }: { products: DashboardTopProduct[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay ventas"
        description="Los productos más vendidos van a aparecer acá apenas se registre el primer pedido."
      />
    );
  }

  const maxQuantity = Math.max(...products.map((product) => product.quantitySold));

  return (
    <ul className="flex flex-col gap-4">
      {products.map((product, index) => (
        <li key={product.productId ?? product.productName} className="flex items-center gap-4">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              RANK_BADGE[index] ?? "bg-muted text-muted-foreground"
            )}
          >
            {index + 1}
          </span>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-foreground">{product.productName}</span>
              <span className="text-muted-foreground">
                {product.quantitySold} vendido{product.quantitySold === 1 ? "" : "s"}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${(product.quantitySold / maxQuantity) * 100}%` }}
              />
            </div>
          </div>
          <span className="w-24 shrink-0 text-right text-sm font-medium text-foreground">
            {formatPrice(product.revenue)}
          </span>
        </li>
      ))}
    </ul>
  );
}
