export type DeliveryMethod = "delivery" | "pickup";

/**
 * El id del método elegido en `payment_methods` (Supabase). Antes eran
 * dos literales fijos ("transfer" | "cash") porque los dos únicos
 * métodos vivían hardcodeados en el componente; ahora los administra el
 * dueño desde /admin/pagos, así que el valor es el id de la fila.
 * Arranca vacío hasta que `PaymentMethod` termina de cargar la lista y
 * selecciona el primero.
 */
export type PaymentMethodValue = string;

export type CheckoutFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  deliveryMethod: DeliveryMethod;
  department: string;
  city: string;
  neighborhood: string;
  address: string;
  reference: string;
  /** Coordenadas elegidas en el mapa de LocationPicker. null hasta que el cliente mueve el marcador. */
  latitude: number | null;
  longitude: number | null;
  paymentMethod: PaymentMethodValue;
  notes: string;
};

export const initialCheckoutFormValues: CheckoutFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  deliveryMethod: "delivery",
  department: "",
  city: "",
  neighborhood: "",
  address: "",
  reference: "",
  latitude: null,
  longitude: null,
  paymentMethod: "",
  notes: "",
};

export type CheckoutFieldChange = <K extends keyof CheckoutFormValues>(
  field: K,
  value: CheckoutFormValues[K]
) => void;
