"use client";

import { useRouter } from "next/navigation";

import { CustomerInformation } from "@/components/storefront/CustomerInformation";
import { OrderNotes } from "@/components/storefront/OrderNotes";
import { PaymentMethod } from "@/components/storefront/PaymentMethod";
import { ShippingInformation } from "@/components/storefront/ShippingInformation";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useCheckoutStore } from "@/store/checkout-store";

/**
 * Dueña del estado del formulario. Los componentes de cada sección son
 * puramente presentacionales: reciben valores y un único onChange
 * tipado, nunca leen ni escriben el estado por su cuenta.
 *
 * El estado vive en useCheckoutStore (Sprint 3.6) en vez de un useState
 * local: /checkout/confirmacion es otra ruta, y sin este store los datos
 * ingresados acá se perderían al navegar (y "Editar datos" volvería a
 * un formulario vacío). Mismo patrón que el Cart Store.
 */
export function CheckoutForm() {
  const router = useRouter();
  const values = useCheckoutStore((state) => state.values);
  const setField = useCheckoutStore((state) => state.setField);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Todavía no hay pedido real: el envío por WhatsApp se conecta en un
    // sprint futuro, desde /checkout/confirmacion.
    router.push("/checkout/confirmacion");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <CustomerInformation values={values} onChange={setField} />
      <ShippingInformation values={values} onChange={setField} />
      <PaymentMethod value={values.paymentMethod} onChange={setField} />
      <OrderNotes value={values.notes} onChange={setField} />

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        {siteConfig.checkoutPage.continueButton}
      </Button>
    </form>
  );
}
