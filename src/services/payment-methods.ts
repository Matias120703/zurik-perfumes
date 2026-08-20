import { createClient } from "@/lib/supabase/client";
import { assertRowAffected } from "@/lib/supabase/assert-write";
import {
  PAYMENT_METHOD_SELECT,
  mapPaymentMethodRow,
  type PaymentMethod,
  type PaymentMethodRow,
} from "@/lib/payment-methods";

/**
 * CRUD admin de `payment_methods`. Mismo patrón de capas que
 * `services/categories.ts`: ningún componente arma una query.
 *
 * Sin restricción de borrado a nivel de servicio: `orders.payment_method_id`
 * es `on delete set null`, así que eliminar un método no puede romper
 * ningún pedido histórico -- el nombre queda igual guardado en
 * `orders.payment_method_name`. Es la diferencia con Categorías, donde el
 * `on delete restrict` de `products.category_id` sí obliga a bloquear.
 */

export type PaymentMethodInput = {
  name: string;
  instructions: string | null;
  isActive: boolean;
  displayOrder: number;
};

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select(PAYMENT_METHOD_SELECT)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as unknown as PaymentMethodRow[]).map(mapPaymentMethodRow);
}

function toRow(input: PaymentMethodInput) {
  return {
    name: input.name.trim(),
    instructions: input.instructions?.trim() ? input.instructions.trim() : null,
    is_active: input.isActive,
    display_order: input.displayOrder,
  };
}

export async function createPaymentMethod(input: PaymentMethodInput): Promise<PaymentMethod> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .insert(toRow(input))
    .select(PAYMENT_METHOD_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return mapPaymentMethodRow(data as unknown as PaymentMethodRow);
}

export async function updatePaymentMethod(
  id: string,
  input: PaymentMethodInput
): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .update(toRow(input))
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  assertRowAffected(
    data,
    "No se pudo actualizar el método de pago: no tenés permisos de administrador o el método ya no existe."
  );
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  assertRowAffected(
    data,
    "No se pudo eliminar el método de pago: no tenés permisos de administrador o el método ya no existe."
  );
}
