import { siteConfig } from "@/config/site";
import type { CheckoutFormValues } from "@/lib/checkout";
import { formatPrice, getWhatsAppUrl } from "@/lib/utils";
import type { CartLineItem } from "@/store/cart-store";

const SECTION_DIVIDER = "━━━━━━━━━━━━━━━━";

/**
 * Bloque del método de pago. Cuando el método tiene instrucciones
 * cargadas (datos bancarios, alias, billetera), se incluyen en el mensaje
 * y se cierra pidiendo el comprobante.
 *
 * Importante: un link de wa.me **no puede adjuntar un archivo** -- eso lo
 * decide siempre la persona desde su WhatsApp. Lo que sí se puede hacer,
 * y es lo que hace esto, es dejar el pedido del comprobante escrito en el
 * mismo chat donde el cliente ya está, junto a los datos a los que tiene
 * que transferir.
 */
function buildPaymentLines(
  payment: { name: string | null; instructions: string | null },
  fallbackLabel: string
): string[] {
  const lines = [payment.name?.trim() || fallbackLabel];
  const instructions = payment.instructions?.trim();

  if (instructions) {
    lines.push("", instructions, "", "📎 Adjuntá el comprobante del pago en este chat.");
  }

  return lines;
}

export type OrderWhatsAppMessageParams = {
  values: CheckoutFormValues;
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
  /**
   * Método de pago elegido, ya resuelto por `PaymentMethod` y guardado en
   * `useCheckoutStore` -- este archivo no consulta `payment_methods`.
   * `instructions` (datos bancarios) viaja en el mensaje para que el
   * cliente los tenga a mano en el mismo chat donde va a mandar el
   * comprobante, sin tener que volver a la web.
   */
  payment: {
    name: string | null;
    instructions: string | null;
  };
  /**
   * Envío ya resuelto por `ShippingCitySelect`. `checked` distingue
   * "todavía no eligió ciudad" de "eligió pero ninguna tarifa la cubre"
   * (cost null en los dos casos), igual que en `useCheckoutStore`.
   */
  shipping: {
    checked: boolean;
    cost: number | null;
  };
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
  payment,
  shipping: shippingSelection,
}: OrderWhatsAppMessageParams): string {
  const shipping = siteConfig.checkoutPage.shippingInformation;
  const paymentCopy = siteConfig.checkoutPage.paymentMethod;
  const summary = siteConfig.checkoutPage.summary;
  const isPickup = values.deliveryMethod === "pickup";
  const hasCoordinates = values.latitude !== null && values.longitude !== null;

  /**
   * Hasta este sprint el mensaje mostraba siempre el placeholder "Se
   * calcula en el próximo paso" y un total igual al subtotal, aunque la
   * pantalla y el pedido guardado en Supabase ya tuvieran el costo real
   * desde el Sprint 6.2 (pendiente documentado: "NO modificar WhatsApp"
   * era instrucción explícita de aquel sprint). Ahora los tres coinciden.
   */
  const showRealShipping = !isPickup && shippingSelection.checked;
  const shippingCost = showRealShipping ? shippingSelection.cost : null;
  const shippingLine = isPickup
    ? shipping.pickupOption
    : !showRealShipping
      ? summary.shippingPlaceholder
      : shippingCost !== null
        ? formatPrice(shippingCost)
        : shipping.shippingCostToConfirm;
  const total = subtotal + (shippingCost ?? 0);

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
      `Envío: ${shippingLine}`,
      `Total: ${formatPrice(total)}`,
    ].join("\n"),
    ["*ENTREGA*", ...deliveryLines].join("\n"),
    ["*MÉTODO DE PAGO*", ...buildPaymentLines(payment, paymentCopy.title)].join("\n"),
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
