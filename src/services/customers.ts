import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/services/orders";

/**
 * Toda la comunicación admin con `customers` (+ sus `orders`, para el
 * historial y las estadísticas) vive acá -- mismo criterio que
 * `services/products.ts`/`services/categories.ts`/`services/orders.ts`.
 * A diferencia de esas tres, este módulo es de **solo lectura**: no hay
 * alta ni edición ni baja de clientes -- los crea (por upsert de
 * teléfono) únicamente `create_order` (Fase 15), cuando se registra el
 * primer pedido. `OrderStatus` se reutiliza de `services/orders.ts`
 * (import de solo lectura, no se modifica ese archivo -- "NO modificar
 * Pedidos" sigue respetado).
 *
 * Las estadísticas (total gastado, cantidad de pedidos, ticket promedio,
 * primera/última compra) **no se guardan en ninguna tabla ni vista**: se
 * calculan acá mismo, en memoria, a partir de los pedidos ya traídos --
 * mismo criterio de "calcular en memoria para un catálogo chico" que ya
 * usan `useProducts`/`useCategories`/`useOrders` para su búsqueda/orden.
 * Con el volumen de pedidos de una tienda chica, no se justifica una
 * vista de Postgres para esto todavía (ver CLAUDE.md, sección 9, Fase 16,
 * para la justificación completa de esta decisión).
 */

export type AdminCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

export type AdminCustomerOrderSummary = {
  id: string;
  orderNumber: number;
  createdAt: string;
  status: OrderStatus;
  total: number;
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: "transfer" | "cash";
};

export type AdminCustomerStats = {
  totalSpent: number;
  orderCount: number;
  averageTicket: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
};

export type AdminCustomerDetail = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string | null;
  createdAt: string;
  /** Derivada del pedido de Delivery más reciente -- `customers` nunca
   * guarda una dirección propia (docs/database-architecture.md, sección
   * 4.3: la dirección es un dato del pedido, no del cliente). Si todos
   * los pedidos del cliente fueron Retiro en tienda, queda en null. */
  primaryAddress: string | null;
  stats: AdminCustomerStats;
  orders: AdminCustomerOrderSummary[];
};

type CustomerOrderRow = {
  total: number;
  created_at: string;
};

type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  created_at: string;
  orders: CustomerOrderRow[];
};

const CUSTOMER_LIST_SELECT = `
  id, first_name, last_name, phone, email, created_at,
  orders ( total, created_at )
`;

function mapCustomerRow(row: CustomerRow): AdminCustomer {
  const orderCount = row.orders.length;
  const totalSpent = row.orders.reduce((sum, order) => sum + Number(order.total), 0);
  const lastOrderAt = orderCount > 0
    ? row.orders.reduce((latest, order) => (order.created_at > latest ? order.created_at : latest), row.orders[0].created_at)
    : null;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
    orderCount,
    totalSpent,
    lastOrderAt,
  };
}

export async function listCustomers(): Promise<AdminCustomer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as CustomerRow[]).map(mapCustomerRow);
}

type CustomerDetailOrderRow = {
  id: string;
  order_number: number;
  status: OrderStatus;
  total: number;
  delivery_method: "delivery" | "pickup";
  payment_method: "transfer" | "cash";
  department: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  created_at: string;
};

export async function getCustomerById(id: string): Promise<AdminCustomerDetail | null> {
  const supabase = createClient();

  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone, email, created_at")
    .eq("id", id)
    .maybeSingle();

  if (customerError) throw new Error(customerError.message);
  if (!customerData) return null;

  const { data: orderRows, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total, delivery_method, payment_method, department, city, neighborhood, address, created_at"
    )
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  if (ordersError) throw new Error(ordersError.message);

  const orders = (orderRows ?? []) as unknown as CustomerDetailOrderRow[];

  const orderSummaries: AdminCustomerOrderSummary[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    createdAt: order.created_at,
    status: order.status,
    total: Number(order.total),
    deliveryMethod: order.delivery_method,
    paymentMethod: order.payment_method,
  }));

  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const orderCount = orders.length;

  // orders ya viene ordenado created_at desc -- el primero es la última
  // compra, el último es la primera compra.
  const lastOrderAt = orderCount > 0 ? orders[0].created_at : null;
  const firstOrderAt = orderCount > 0 ? orders[orderCount - 1].created_at : null;

  const mostRecentDelivery = orders.find((order) => order.delivery_method === "delivery" && order.address);
  const primaryAddress = mostRecentDelivery
    ? [mostRecentDelivery.address, mostRecentDelivery.neighborhood, mostRecentDelivery.city, mostRecentDelivery.department]
        .filter(Boolean)
        .join(", ")
    : null;

  return {
    id: customerData.id,
    firstName: customerData.first_name,
    lastName: customerData.last_name,
    fullName: `${customerData.first_name} ${customerData.last_name}`.trim(),
    phone: customerData.phone,
    email: customerData.email,
    createdAt: customerData.created_at,
    primaryAddress,
    stats: {
      totalSpent,
      orderCount,
      averageTicket: orderCount > 0 ? totalSpent / orderCount : 0,
      firstOrderAt,
      lastOrderAt,
    },
    orders: orderSummaries,
  };
}
