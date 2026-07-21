import { siteConfig } from "@/config/site";
import type { CheckoutFormValues } from "@/lib/checkout";
import { formatPrice, getWhatsAppUrl } from "@/lib/utils";
import type { CartLineItem } from "@/store/cart-store";

const SECTION_DIVIDER = "━━━━━━━━━━━━━━━━";

export type OrderWhatsAppMessageParams = {
  values: CheckoutFormValues;
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
};

/**
 * Arma el texto del pedido que se manda por WhatsApp. Vive acá (y no en
 * OrderConfirmationDetails) para que armar el mensaje sea una operación
 * independiente de la UI: el día que el pedido también se guarde en
 * Supabase, esta misma función sirve para generar el texto a persistir,
 * sin tocar el componente.
 */
export function buildOrderWhatsAppMessage({
  values,
  items,
  itemCount,
  subtotal,
}: OrderWhatsAppMessageParams): string {
  const shipping = siteConfig.checkoutPage.shippingInformation;
  const payment = siteConfig.checkoutPage.paymentMethod;
  const summary = siteConfig.checkoutPage.summary;
  const isPickup = values.deliveryMethod === "pickup";
  const hasCoordinates = values.latitude !== null && values.longitude !== null;

  const productLines = items.map((item) => {
    const itemSubtotal = item.product.price * item.quantity;
    return [
      `• ${item.product.name}`,
      `  Cantidad: ${item.quantity}`,
      `  Precio unitario: ${formatPrice(item.product.price)}`,
      `  Subtotal: ${formatPrice(itemSubtotal)}`,
    ].join("\n");
  });

  const customerLines = [
    `Nombre: ${values.firstName} ${values.lastName}`.trim(),
    `Teléfono: ${values.phone}`,
  ];
  if (values.email) customerLines.push(`Email: ${values.email}`);

  const deliveryLines: string[] = [isPickup ? shipping.pickupOption : shipping.deliveryOption];
  if (!isPickup) {
    deliveryLines.push(
      `Dirección: ${values.department}, ${values.city}, ${values.neighborhood}, ${values.address}`
    );
    if (values.reference) deliveryLines.push(`Referencia: ${values.reference}`);
    if (hasCoordinates) {
      deliveryLines.push(`Coordenadas: ${values.latitude}, ${values.longitude}`);
      deliveryLines.push(
        `Ver en el mapa: https://www.google.com/maps?q=${values.latitude},${values.longitude}`
      );
    }
  }

  const sections = [
    "🛒 *NUEVO PEDIDO*",
    ["*DATOS DEL CLIENTE*", ...customerLines].join("\n"),
    ["*PRODUCTOS*", productLines.join("\n\n")].join("\n"),
    [
      "*RESUMEN*",
      `Cantidad total: ${itemCount}`,
      `Subtotal: ${formatPrice(subtotal)}`,
      `Envío: ${summary.shippingPlaceholder}`,
      `Total: ${formatPrice(subtotal)}`,
    ].join("\n"),
    ["*ENTREGA*", ...deliveryLines].join("\n"),
    [
      "*MÉTODO DE PAGO*",
      values.paymentMethod === "cash" ? payment.cashOption : payment.transferOption,
    ].join("\n"),
  ];

  if (values.notes.trim()) {
    sections.push(["*NOTAS*", values.notes.trim()].join("\n"));
  }

  return `${SECTION_DIVIDER}\n\n${sections.join(`\n\n${SECTION_DIVIDER}\n\n`)}\n\n${SECTION_DIVIDER}`;
}

/**
 * Único punto que el resto de la app necesita llamar: arma el mensaje y lo
 * devuelve ya como URL de wa.me, reutilizando getWhatsAppUrl (lib/utils.ts)
 * en vez de reimplementar el armado del link. `whatsappNumber` se recibe
 * por parámetro -- viene de `business_settings` (Supabase), resuelto por
 * quien llama; este archivo no importa `config/business.ts` desde el
 * Sprint 6.0.1 (bug 3: el mensaje de WhatsApp del pedido seguía leyendo
 * el número estático mientras el resto de la tienda ya usaba Supabase).
 */
export function getOrderWhatsAppUrl(
  params: OrderWhatsAppMessageParams,
  whatsappNumber: string
): string {
  return getWhatsAppUrl(whatsappNumber, buildOrderWhatsAppMessage(params));
}
