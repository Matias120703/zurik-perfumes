"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CustomerInformation } from "@/components/storefront/CustomerInformation";
import { OrderNotes } from "@/components/storefront/OrderNotes";
import { PaymentMethod } from "@/components/storefront/PaymentMethod";
import { ShippingInformation } from "@/components/storefront/ShippingInformation";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getPublicBusinessSettingsClient } from "@/services/storefront/business-client";
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

  /**
   * ¿La tienda ofrece "Retiro en tienda"? Se resuelve acá, una sola vez,
   * y baja por prop a `ShippingInformation` -- que cada sección del
   * formulario haga su propia consulta multiplicaría los round-trips de
   * una pantalla que ya es crítica para la conversión.
   *
   * Con el cliente de browser porque `/checkout` es "use client" de punta
   * a punta (depende de los stores), igual que `PaymentMethod`.
   */
  const [pickupEnabled, setPickupEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    getPublicBusinessSettingsClient()
      .then((settings) => {
        if (active) setPickupEnabled(settings.pickupEnabled);
      })
      // Si la consulta falla, se asume la opción más segura: sólo
      // Delivery. Ofrecer un retiro que la tienda quizá no tenga sería
      // peor que no ofrecerlo.
      .catch(() => {
        if (active) setPickupEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  /**
   * Si el retiro está apagado pero el store todavía tiene "pickup"
   * seleccionado (el cliente lo eligió antes de que el dueño lo
   * desactivara, y el estado sobrevive en memoria), se vuelve a
   * "delivery" -- si no, el checkout escondería los campos de dirección
   * sin ninguna forma visible de recuperarlos.
   */
  useEffect(() => {
    if (pickupEnabled === false && values.deliveryMethod === "pickup") {
      setField("deliveryMethod", "delivery");
    }
  }, [pickupEnabled, values.deliveryMethod, setField]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Todavía no hay pedido real: el envío por WhatsApp se conecta en un
    // sprint futuro, desde /checkout/confirmacion.
    router.push("/checkout/confirmacion");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <CustomerInformation values={values} onChange={setField} />
      <ShippingInformation
        values={values}
        onChange={setField}
        pickupEnabled={pickupEnabled}
      />
      <PaymentMethod value={values.paymentMethod} onChange={setField} />
      <OrderNotes value={values.notes} onChange={setField} />

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        {siteConfig.checkoutPage.continueButton}
      </Button>
    </form>
  );
}
