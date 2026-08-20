import { createClient } from "@/lib/supabase/client";
import {
  PAYMENT_METHOD_SELECT,
  mapPaymentMethodRow,
  type PaymentMethod,
  type PaymentMethodRow,
} from "@/lib/payment-methods";

/**
 * Métodos de pago visibles en el checkout.
 *
 * Usa el cliente de **browser**, no el de servidor, por el mismo motivo
 * que `services/storefront/logistics.ts` (Sprint 6.2): `/checkout` es
 * "use client" de punta a punta (depende de `useCheckoutStore`), así que
 * nunca hay una página que pueda resolver esto durante su render.
 *
 * Filtra `is_active` explícitamente además de RLS -- misma razón que el
 * resto de `services/storefront/*` desde el Sprint 6.0.1: si quien
 * navega tiene una sesión de admin abierta en el mismo navegador, la
 * policy de admin le dejaría ver también los métodos desactivados.
 */
export async function getPublicPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select(PAYMENT_METHOD_SELECT)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as unknown as PaymentMethodRow[]).map(mapPaymentMethodRow);
}
