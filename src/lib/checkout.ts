export type DeliveryMethod = "delivery" | "pickup";
export type PaymentMethodValue = "transfer" | "cash";

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
  paymentMethod: "transfer",
  notes: "",
};

export type CheckoutFieldChange = <K extends keyof CheckoutFormValues>(
  field: K,
  value: CheckoutFormValues[K]
) => void;
