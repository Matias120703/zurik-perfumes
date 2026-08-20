/**
 * Contrato compartido de `payment_methods`, usado por el checkout público
 * y por el panel. Vive en `lib/` y no dentro de un servicio por el mismo
 * motivo que `lib/home-content.ts`: la forma del dato es idéntica de los
 * dos lados, y así ningún Client Component termina colgando de un archivo
 * que importe el cliente de servidor de Supabase.
 */

export type PaymentMethod = {
  id: string;
  name: string;
  /**
   * Instrucciones de pago que ve el cliente (datos bancarios, alias,
   * número de billetera...). `null` en los métodos que no necesitan
   * ninguna, como "Efectivo".
   */
  instructions: string | null;
  isActive: boolean;
  displayOrder: number;
};

export type PaymentMethodRow = {
  id: string;
  name: string;
  instructions: string | null;
  is_active: boolean;
  display_order: number;
};

export const PAYMENT_METHOD_SELECT = "id, name, instructions, is_active, display_order";

export function mapPaymentMethodRow(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    name: row.name,
    instructions: row.instructions,
    isActive: row.is_active,
    displayOrder: row.display_order,
  };
}

/** ¿Este método necesita que el cliente muestre un comprobante? */
export function requiresProofOfPayment(method: Pick<PaymentMethod, "instructions">): boolean {
  return Boolean(method.instructions?.trim());
}

/**
 * Etiquetas de los dos métodos que existían hardcodeados antes de que
 * `payment_methods` fuera una tabla. Sólo se usan para que los pedidos
 * anteriores a esa migración (que guardaron 'transfer'/'cash' en
 * `orders.payment_method`, sin `payment_method_name`) sigan mostrándose
 * legibles en el panel -- ningún pedido nuevo pasa por acá.
 */
const LEGACY_PAYMENT_LABELS: Record<string, string> = {
  transfer: "Transferencia bancaria",
  cash: "Efectivo",
};

export function getOrderPaymentLabel(order: {
  paymentMethod: string;
  paymentMethodName: string | null;
}): string {
  return (
    order.paymentMethodName?.trim() ||
    LEGACY_PAYMENT_LABELS[order.paymentMethod] ||
    order.paymentMethod
  );
}
