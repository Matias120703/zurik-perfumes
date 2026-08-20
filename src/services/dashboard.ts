import { createClient } from "@/lib/supabase/client";
import {
  CANCELLED_ORDER_STATUS,
  ORDER_STATUSES,
  countsAsSale,
  type OrderStatus,
} from "@/services/orders";

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
  /** Se muestra junto a "total de pedidos" para que las cifras de venta
   * (que lo excluyen) reconcilien con el conteo de pedidos. */
  cancelledOrders: number;
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

/**
 * Señales de "¿la tienda ya está lista para vender?", usadas por la guía
 * de puesta en marcha que /admin muestra mientras no haya pedidos.
 *
 * Se calculan igual que el resto del Dashboard -- consultando en el
 * momento, nunca guardando un estado de "paso completado". Un tilde
 * guardado se desincroniza en cuanto alguien borra la última foto o la
 * última tarifa de envío; una consulta no puede mentir.
 */
export type DashboardSetup = {
  hasProductPhotos: boolean;
  hasHomeContent: boolean;
  hasShippingRates: boolean;
};

export type DashboardData = {
  summary: DashboardSummary;
  sales: DashboardSales;
  recentOrders: DashboardRecentOrder[];
  topProducts: DashboardTopProduct[];
  statusBreakdown: DashboardStatusBreakdown[];
  setup: DashboardSetup;
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

/**
 * `orders!inner(status)` fuerza un INNER JOIN contra el pedido dueño de
 * cada línea, que es lo que permite filtrar por `orders.status` desde
 * PostgREST. Sin el `!inner` el filtro sobre el recurso embebido no
 * descarta la fila, sólo vacía el embed.
 */
const TOP_PRODUCTS_SELECT = "product_id, product_name, quantity, subtotal, orders!inner(status)";

const RECENT_ORDERS_LIMIT = 10;
const TOP_PRODUCTS_LIMIT = 5;

/**
 * Un solo `select` sobre `orders` (status/total/created_at, todas las
 * filas) alimenta a la vez el resumen (total/pendientes/entregados),
 * ventas (total/ticket promedio/última venta) y el desglose por estado --
 * evita repetir la misma consulta tres veces. Las cifras de venta
 * (total/ticket promedio/última venta) filtran después los cancelados
 * con `countsAsSale` -- ver el comentario de esa función.
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

/**
 * Las tres señales de la guía de puesta en marcha, en una sola pasada.
 * Cada consulta pide `head: true` con `limit(1)`: sólo interesa si existe
 * al menos una fila, nunca su contenido.
 */
async function getSetupSignals(): Promise<DashboardSetup> {
  const supabase = createClient();

  const [photos, homeContent, shipping] = await Promise.all([
    supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .like("url", "http%"),
    supabase.from("home_content").select("hero_title").eq("id", 1).maybeSingle(),
    supabase.from("shipping_rates").select("id", { count: "exact", head: true }),
  ]);

  return {
    /**
     * Una fila en `product_images` puede ser todavía un placeholder del
     * seed (ruta relativa, nunca un archivo real) -- por eso se exige una
     * URL absoluta de Storage, el mismo criterio que `isRealImageUrl`
     * usa en la tienda para decidir si muestra la foto o el placeholder.
     */
    hasProductPhotos: (photos.count ?? 0) > 0,
    hasHomeContent: Boolean(homeContent.data?.hero_title?.trim()),
    hasShippingRates: (shipping.count ?? 0) > 0,
  };
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
    .select(TOP_PRODUCTS_SELECT)
    // Un pedido cancelado no vendió nada: sus líneas no cuentan acá.
    .neq("orders.status", CANCELLED_ORDER_STATUS);
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
  const [
    orderRows,
    activeProducts,
    activeCategories,
    totalCustomers,
    recentOrders,
    topProducts,
    setup,
  ] = await Promise.all([
    getOrderAggregates(),
    getActiveCount("products"),
    getActiveCount("categories"),
    getCustomerCount(),
    getRecentOrders(),
    getTopProducts(),
    getSetupSignals(),
  ]);

  const totalOrders = orderRows.length;

  // Las tres cifras de dinero se calculan sólo sobre los pedidos que
  // cuentan como venta -- un cancelado no facturó nada.
  const saleRows = orderRows.filter(countsAsSale);
  const totalSales = saleRows.reduce((sum, order) => sum + Number(order.total), 0);
  const lastSaleAt = saleRows.reduce<string | null>(
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
      cancelledOrders: countByStatus.get(CANCELLED_ORDER_STATUS) ?? 0,
      totalCustomers,
      activeProducts,
      activeCategories,
    },
    sales: {
      totalSales,
      // Promedio sobre los pedidos que efectivamente son venta, no sobre
      // el total -- dividir por pedidos cancelados bajaría el ticket
      // promedio de forma artificial.
      averageTicket: saleRows.length > 0 ? totalSales / saleRows.length : 0,
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
    setup,
  };
}
