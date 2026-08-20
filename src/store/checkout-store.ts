import { create } from "zustand";

import { initialCheckoutFormValues, type CheckoutFormValues } from "@/lib/checkout";

export type ShippingResult = {
  rateId: string | null;
  rateName: string | null;
  cost: number | null;
  estimatedDays: string | null;
};

type CheckoutState = {
  values: CheckoutFormValues;
  setField: <K extends keyof CheckoutFormValues>(
    field: K,
    value: CheckoutFormValues[K]
  ) => void;
  /** Setea lat/lng en una sola actualización (LocationPicker, Sprint 3.7). */
  setLocation: (latitude: number, longitude: number) => void;
  /**
   * Resultado de buscar la tarifa de envío de la ciudad elegida (Sprint
   * 6.2). `shippingChecked` distingue "todavía no eligió ciudad" (false,
   * CheckoutSummary sigue mostrando el placeholder de siempre) de "eligió
   * ciudad pero ninguna tarifa la cubre" (true, cost null -- "A
   * confirmar"): ambos casos comparten `shippingCost: null`, por eso hace
   * falta un booleano aparte en vez de inferirlo de `shippingCost`.
   */
  shippingChecked: boolean;
  shippingRateId: string | null;
  shippingRateName: string | null;
  shippingCost: number | null;
  shippingEstimatedDays: string | null;
  setShippingResult: (result: ShippingResult) => void;
  /** Vuelve al estado "todavía no eligió ciudad" -- se llama al cambiar de
   * departamento/ciudad (mientras se resuelve la nueva búsqueda) o al
   * pasar a "Retiro en tienda". */
  resetShipping: () => void;

  /**
   * Nombre e instrucciones del método de pago elegido. `values.paymentMethod`
   * guarda sólo el id; estos dos son el snapshot legible que necesitan la
   * pantalla de confirmación, el mensaje de WhatsApp y el pedido guardado
   * en Supabase -- ninguno de los tres puede volver a consultar
   * `payment_methods` por su cuenta. Mismo patrón que `shippingRateName`:
   * un dato que resuelve un componente del formulario y que el resto del
   * flujo consume ya resuelto.
   */
  paymentMethodName: string | null;
  paymentMethodInstructions: string | null;
  setPaymentMethodDetails: (details: {
    name: string | null;
    instructions: string | null;
  }) => void;
};

/**
 * Única fuente de verdad del formulario de checkout. Existe para que los
 * datos ingresados en /checkout sobrevivan la navegación a
 * /checkout/confirmacion (rutas distintas, sin persistencia todavía):
 * sin este store, el useState local de CheckoutForm se perdería al
 * desmontarse. Mismo patrón que store/cart-store.ts.
 */
export const useCheckoutStore = create<CheckoutState>((set) => ({
  values: initialCheckoutFormValues,

  setField: (field, value) =>
    set((state) => ({ values: { ...state.values, [field]: value } })),

  setLocation: (latitude, longitude) =>
    set((state) => ({ values: { ...state.values, latitude, longitude } })),

  shippingChecked: false,
  shippingRateId: null,
  shippingRateName: null,
  shippingCost: null,
  shippingEstimatedDays: null,

  setShippingResult: (result) =>
    set({
      shippingChecked: true,
      shippingRateId: result.rateId,
      shippingRateName: result.rateName,
      shippingCost: result.cost,
      shippingEstimatedDays: result.estimatedDays,
    }),

  resetShipping: () =>
    set({
      shippingChecked: false,
      shippingRateId: null,
      shippingRateName: null,
      shippingCost: null,
      shippingEstimatedDays: null,
    }),

  paymentMethodName: null,
  paymentMethodInstructions: null,

  setPaymentMethodDetails: (details) =>
    set({
      paymentMethodName: details.name,
      paymentMethodInstructions: details.instructions,
    }),
}));
