import { createClient } from "@/lib/supabase/client";
import type { CheckoutFormValues } from "@/lib/checkout";
import type { CartLineItem } from "@/store/cart-store";

/**
 * Única vía de escritura pública hacia `orders`/`order_items`/`customers`
 * (Sprint 5.6) -- a diferencia del resto de `services/storefront/*`, usa
 * el cliente de **browser** (`lib/supabase/client.ts`), no el de servidor:
 * esto se invoca desde un click en un Client Component ya hidratado
 * (`OrderConfirmationDetails`, dentro de Checkout), no durante el render
 * de una página. Mismo criterio que ya usa `services/products.ts` del
 * panel para sus escrituras.
 *
 * Toda la escritura real vive en la función de Postgres `create_order`
 * (`supabase/migrations/..._create_order_function.sql`) -- acá solo se
 * arma el payload y se invoca. Ver esa migración para la garantía de
 * atomicidad (una función de Postgres es una única transacción implícita).
 */

export type CreateOrderResult = {
  orderId: string;
  orderNumber: number;
};

/** Lo que ShippingCitySelect ya resolvió y dejó en useCheckoutStore (Sprint
 * 6.2) -- null en "Retiro en tienda" (sin envío) o si todavía no se buscó
 * ninguna tarifa. `cost` a su vez puede ser null con `rateId`/`rateName`
 * también null: la ciudad elegida no tiene ninguna tarifa que la cubra
 * ("A confirmar") -- se guarda tal cual, nunca se inventa un número. */
export type ShippingSelection = {
  cost: number | null;
  rateId: string | null;
  rateName: string | null;
};

export async function createOrder(
  values: CheckoutFormValues,
  items: CartLineItem[],
  subtotal: number,
  whatsappMessage: string,
  shipping: ShippingSelection | null
): Promise<CreateOrderResult> {
  const supabase = createClient();

  // Sprint 6.2: el total pasa a incluir el costo de envío real (0 si no
  // aplica -- Retiro en tienda, o ciudad sin tarifa configurada todavía).
  const total = subtotal + (shipping?.cost ?? 0);

  const { data, error } = await supabase.rpc("create_order", {
    p_first_name: values.firstName,
    p_last_name: values.lastName,
    p_phone: values.phone,
    p_email: values.email || null,
    p_delivery_method: values.deliveryMethod,
    p_payment_method: values.paymentMethod,
    p_department: values.deliveryMethod === "delivery" ? values.department : null,
    p_city: values.deliveryMethod === "delivery" ? values.city : null,
    p_neighborhood: values.deliveryMethod === "delivery" ? values.neighborhood : null,
    p_address: values.deliveryMethod === "delivery" ? values.address : null,
    p_reference: values.deliveryMethod === "delivery" ? values.reference || null : null,
    p_latitude: values.deliveryMethod === "delivery" ? values.latitude : null,
    p_longitude: values.deliveryMethod === "delivery" ? values.longitude : null,
    p_notes: values.notes || null,
    p_subtotal: subtotal,
    p_total: total,
    p_whatsapp_message: whatsappMessage,
    p_items: items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      unit_price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    })),
    p_shipping_cost: shipping?.cost ?? null,
    p_shipping_rate_id: shipping?.rateId ?? null,
    p_shipping_rate_name: shipping?.rateName ?? null,
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  return { orderId: row.order_id, orderNumber: Number(row.order_number) };
}
