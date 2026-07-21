import { createClient } from "@/lib/supabase/client";
import { assertRowAffected } from "@/lib/supabase/assert-write";

/**
 * Toda la comunicación admin con `orders`/`order_items`/`customers` vive
 * acá -- mismo criterio que `services/products.ts`/`services/categories.ts`.
 * A diferencia de esas dos, no hay alta ni baja: los pedidos los crea el
 * checkout público (`services/storefront/orders.ts`, vía la función RPC
 * `create_order`), acá solo se lee y se cambia el estado.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_or_shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "preparing", label: "En preparación" },
  { value: "ready_or_shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  createdAt: string;
  status: OrderStatus;
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: "transfer" | "cash";
  department: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  subtotal: number;
  shippingCost: number | null;
  /** Nombre de la tarifa de envío usada (Sprint 6.2) -- snapshot de texto,
   * null si el pedido es Retiro en tienda o si la ciudad no tenía ninguna
   * tarifa configurada ("A confirmar", junto con shippingCost null). */
  shippingRateName: string | null;
  total: number;
  whatsappMessage: string | null;
  itemCount: number;
  items: AdminOrderItem[];
};

type OrderRow = {
  id: string;
  order_number: number;
  status: OrderStatus;
  delivery_method: "delivery" | "pickup";
  payment_method: "transfer" | "cash";
  department: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  subtotal: number;
  shipping_cost: number | null;
  shipping_rate_name: string | null;
  total: number;
  whatsapp_message: string | null;
  created_at: string;
  customers: { first_name: string; last_name: string; phone: string; email: string | null } | null;
  order_items: {
    id: string;
    product_id: string | null;
    product_name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }[];
};

const ORDER_SELECT = `
  id, order_number, status, delivery_method, payment_method,
  department, city, neighborhood, address, reference, latitude, longitude, notes,
  subtotal, shipping_cost, shipping_rate_name, total, whatsapp_message, created_at,
  customers ( first_name, last_name, phone, email ),
  order_items ( id, product_id, product_name, unit_price, quantity, subtotal )
`;

function mapOrderRow(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customers ? `${row.customers.first_name} ${row.customers.last_name}`.trim() : "—",
    customerPhone: row.customers?.phone ?? "—",
    customerEmail: row.customers?.email ?? null,
    createdAt: row.created_at,
    status: row.status,
    deliveryMethod: row.delivery_method,
    paymentMethod: row.payment_method,
    department: row.department,
    city: row.city,
    neighborhood: row.neighborhood,
    address: row.address,
    reference: row.reference,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    notes: row.notes,
    subtotal: Number(row.subtotal),
    shippingCost: row.shipping_cost !== null ? Number(row.shipping_cost) : null,
    shippingRateName: row.shipping_rate_name,
    total: Number(row.total),
    whatsappMessage: row.whatsapp_message,
    itemCount: row.order_items.reduce((sum, item) => sum + item.quantity, 0),
    items: [...row.order_items]
      .map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
  };
}

export async function listOrders(): Promise<AdminOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as OrderRow[]).map(mapOrderRow);
}

export async function getOrderById(id: string): Promise<AdminOrder | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapOrderRow(data as unknown as OrderRow) : null;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  assertRowAffected(
    data,
    "No se pudo actualizar el estado del pedido: no tenés permisos de administrador o el pedido ya no existe."
  );
}
