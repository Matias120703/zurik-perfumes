import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUSES, type OrderStatus } from "@/services/orders";

/**
 * Toda la comunicación admin para el Dashboard vive acá -- 100% solo
 * lectura, agregando datos de `orders`/`order_items`/`customers`/
 * `products`/`categories` que ya existen. No se toca ningún archivo de
 * esos módulos (`services/orders.ts`/`categories.ts`/`products.ts`/
 * `customers.ts`): `OrderStatus`/`ORDER_STATUSES` se reutilizan acá con
 * un `import` de solo lectura, mismo criterio ya aplicado en
 * `services/customers.ts` (Fase 16) -- "NO modificar Pedidos/Productos/
 * Categorías/Clientes" se respeta en su totalidad.
 *
 * Ninguna de estas cifras se guarda en ninguna tabla: se recalculan en
 * cada carga a partir de los datos ya existentes (pedido explícito del
 * sprint, "no hardcodear métricas" / "no almacenar estadísticas").
 */

export type DashboardSummary = {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  activeProducts: number;
  activeCategories: number;
};

export type DashboardSales = {
  totalSales: number;
  averageTicket: number;
  lastSaleAt: string | null;
};

export type DashboardRecentOrder = {
  id: string;
  orderNumber: number;
  customerName: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
};

export type DashboardTopProduct = {
  productId: string | null;
  productName: string;
  quantitySold: number;
  revenue: number;
};

export type DashboardStatusBreakdown = {
  status: OrderStatus;
  label: string;
  count: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  sales: DashboardSales;
  recentOrders: DashboardRecentOrder[];
  topProducts: DashboardTopProduct[];
  statusBreakdown: DashboardStatusBreakdown[];
};

type OrderAggregateRow = {
  status: OrderStatus;
  total: number;
  created_at: string;
};

type RecentOrderRow = {
  id: string;
  order_number: number;
  status: OrderStatus;
  total: number;
  created_at: string;
  customers: { first_name: string; last_name: string } | null;
};

type OrderItemAggregateRow = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  subtotal: number;
};

const RECENT_ORDERS_LIMIT = 10;
const TOP_PRODUCTS_LIMIT = 5;

/**
 * Un solo `select` sobre `orders` (status/total/created_at, todas las
 * filas) alimenta a la vez el resumen (total/pendientes/entregados),
 * ventas (total/ticket promedio/última venta) y el desglose por estado --
 * evita repetir la misma consulta tres veces. "Ventas totales"/"ticket
 * promedio" suman **todos** los pedidos sin importar su estado (incluidos
 * los cancelados): mismo criterio ya aplicado a "total gastado" en
 * services/customers.ts (Fase 16) -- el sprint no pidió excluir ningún
 * estado, y mantener el mismo criterio en todo el panel es más
 * consistente que decidirlo distinto acá (ver CLAUDE.md sección 9, Fase 17).
 */
async function getOrderAggregates() {
  const supabase = createClient();
  const { data, error } = await supabase.from("orders").select("status, total, created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OrderAggregateRow[];
}

async function getActiveCount(table: "products" | "categories"): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function getCustomerCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase.from("customers").select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function getRecentOrders(): Promise<DashboardRecentOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at, customers ( first_name, last_name )")
    .order("created_at", { ascending: false })
    .limit(RECENT_ORDERS_LIMIT);

  if (error) throw new Error(error.message);
  return (data as unknown as RecentOrderRow[]).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customers ? `${row.customers.first_name} ${row.customers.last_name}`.trim() : "—",
    createdAt: row.created_at,
    status: row.status,
    total: Number(row.total),
  }));
}

/**
 * Agrupado en memoria, no en una vista de Postgres -- mismo criterio ya
 * documentado para las estadísticas de clientes (Fase 16, ver CLAUDE.md
 * sección 6): el volumen de order_items de una tienda chica no justifica
 * todavía una vista/función agregada. Se agrupa por `product_id` cuando
 * existe (más preciso: dos productos distintos podrían compartir nombre)
 * y se cae a `product_name` cuando el producto ya fue borrado del
 * catálogo (`product_id` queda null, `on delete set null`, Fase 8).
 */
async function getTopProducts(): Promise<DashboardTopProduct[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity, subtotal");
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as OrderItemAggregateRow[];
  const grouped = new Map<string, DashboardTopProduct>();

  for (const row of rows) {
    const key = row.product_id ?? `name:${row.product_name}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantitySold += row.quantity;
      existing.revenue += Number(row.subtotal);
    } else {
      grouped.set(key, {
        productId: row.product_id,
        productName: row.product_name,
        quantitySold: row.quantity,
        revenue: Number(row.subtotal),
      });
    }
  }

  return [...grouped.values()]
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, TOP_PRODUCTS_LIMIT);
}

export async function getDashboardData(): Promise<DashboardData> {
  const [orderRows, activeProducts, activeCategories, totalCustomers, recentOrders, topProducts] =
    await Promise.all([
      getOrderAggregates(),
      getActiveCount("products"),
      getActiveCount("categories"),
      getCustomerCount(),
      getRecentOrders(),
      getTopProducts(),
    ]);

  const totalOrders = orderRows.length;
  const totalSales = orderRows.reduce((sum, order) => sum + Number(order.total), 0);
  const lastSaleAt = orderRows.reduce<string | null>(
    (latest, order) => (latest === null || order.created_at > latest ? order.created_at : latest),
    null
  );

  const countByStatus = new Map<OrderStatus, number>();
  for (const order of orderRows) {
    countByStatus.set(order.status, (countByStatus.get(order.status) ?? 0) + 1);
  }

  return {
    summary: {
      totalOrders,
      pendingOrders: countByStatus.get("pending") ?? 0,
      deliveredOrders: countByStatus.get("delivered") ?? 0,
      totalCustomers,
      activeProducts,
      activeCategories,
    },
    sales: {
      totalSales,
      averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
      lastSaleAt,
    },
    recentOrders,
    topProducts,
    // Estructura lista para un gráfico futuro (pedido explícito del
    // sprint: "preparar la estructura", "no implementar gráficos
    // todavía") -- incluye los 6 estados siempre, aunque tengan 0 pedidos,
    // para que un futuro componente de gráfico no tenga que inventar los
    // que faltan.
    statusBreakdown: ORDER_STATUSES.map((option) => ({
      status: option.value,
      label: option.label,
      count: countByStatus.get(option.value) ?? 0,
    })),
  };
}
