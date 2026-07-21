"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { CheckoutFormValues } from "@/lib/checkout";
import { formatPrice } from "@/lib/utils";
import { buildOrderWhatsAppMessage, getOrderWhatsAppUrl } from "@/lib/whatsapp";
import { getPublicBusinessSettingsClient } from "@/services/storefront/business-client";
import { createOrder } from "@/services/storefront/orders";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";

function ReviewSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

/**
 * Solo lectura: presenta los datos ya cargados en useCheckoutStore. No
 * valida ni recalcula nada — si algo falta, la página que la usa ya
 * redirigió antes de llegar acá.
 */
export function OrderConfirmationDetails({ values }: { values: CheckoutFormValues }) {
  const router = useRouter();

  const t = siteConfig.confirmationPage;
  const shipping = siteConfig.checkoutPage.shippingInformation;
  const payment = siteConfig.checkoutPage.paymentMethod;
  const isPickup = values.deliveryMethod === "pickup";

  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.getTotalItems());
  const subtotal = useCartStore((state) => state.getSubtotal());

  // Envío (Sprint 6.2): ya resuelto por ShippingCitySelect en /checkout y
  // guardado en useCheckoutStore -- acá solo se lee para pasarlo a
  // createOrder(). En "Retiro en tienda" no hay envío que guardar.
  // Nombrada `shippingSelection` (no `shipping`, ya usado más abajo para
  // `siteConfig.checkoutPage.shippingInformation`) para no chocar con esa
  // declaración existente.
  const shippingCost = useCheckoutStore((state) => state.shippingCost);
  const shippingRateId = useCheckoutStore((state) => state.shippingRateId);
  const shippingRateName = useCheckoutStore((state) => state.shippingRateName);
  const shippingEstimatedDays = useCheckoutStore((state) => state.shippingEstimatedDays);
  const shippingSelection = isPickup
    ? null
    : { cost: shippingCost, rateId: shippingRateId, rateName: shippingRateName };

  // El número de WhatsApp viene de business_settings (Supabase), no de
  // config/business.ts -- esta página es "use client" de punta a punta
  // (depende de useCartStore/useCheckoutStore, que no existen del lado
  // del servidor), así que no puede resolverlo con el cliente de
  // servidor como el resto de la tienda pública; se lee acá con el
  // cliente de browser al montar (getPublicBusinessSettingsClient, bug 3,
  // Sprint 6.0.1).
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  useEffect(() => {
    getPublicBusinessSettingsClient()
      .then((settings) => setWhatsappNumber(settings.whatsappNumber))
      .catch(() => setWhatsappNumber(null));
  }, []);

  // El carrito no se limpia acá a propósito: sin una señal de que el
  // mensaje se mandó de verdad (el cliente puede cerrar la pestaña de
  // WhatsApp sin enviar nada), vaciarlo en el click perdería el pedido de
  // la vista del cliente. El pedido en sí, desde el Sprint 5.6, ya queda
  // registrado en Supabase antes de este paso -- lo que no se persiste es
  // la señal de "efectivamente se mandó por WhatsApp".
  const whatsappMessageParams = { values, items, itemCount, subtotal };
  const whatsappMessage = buildOrderWhatsAppMessage(whatsappMessageParams);
  const whatsappUrl = whatsappNumber ? getOrderWhatsAppUrl(whatsappMessageParams, whatsappNumber) : "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderSaved, setOrderSaved] = useState(false);

  /**
   * Orden pedida por el sprint: 1) crear el pedido en Supabase (orders +
   * order_items, atómico -- ver create_order en la migración), 2) recién
   * ahí abrir WhatsApp. La pestaña se abre en blanco de forma síncrona,
   * dentro del mismo gesto de click, y se redirige a la URL real una vez
   * que el guardado termina -- así evitamos que el navegador bloquee un
   * `window.open()` disparado después de un `await` (varios lo tratan
   * como popup no solicitado si no pasa en el mismo tick del click).
   *
   * Si el guardado falla, NO se abre WhatsApp automáticamente: se muestra
   * el error con un botón para reintentar, más un link explícito para
   * continuar solo por WhatsApp sin el registro -- para que una falla de
   * backend nunca le impida al cliente completar su compra (mismo
   * espíritu que "no romper el flujo existente").
   */
  async function handleConfirm(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (!whatsappNumber) return;

    if (orderSaved) {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    const whatsappTab = window.open("", "_blank");

    try {
      await createOrder(values, items, subtotal, whatsappMessage, shippingSelection);
      setOrderSaved(true);
      if (whatsappTab) {
        whatsappTab.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      whatsappTab?.close();
      setSubmitError(err instanceof Error ? err.message : "No se pudo registrar el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ReviewSection
        title={t.customerInformation.title}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/checkout" />}
          >
            {t.editDataButton}
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          <ReviewRow
            label={t.customerInformation.nameLabel}
            value={`${values.firstName} ${values.lastName}`.trim()}
          />
          <ReviewRow label={t.customerInformation.phoneLabel} value={values.phone} />
          {values.email ? (
            <ReviewRow label={t.customerInformation.emailLabel} value={values.email} />
          ) : null}
        </div>
      </ReviewSection>

      <ReviewSection title={shipping.title}>
        <div className="flex flex-col gap-2">
          <ReviewRow
            label={shipping.deliveryMethodLabel}
            value={isPickup ? shipping.pickupOption : shipping.deliveryOption}
          />
          {!isPickup ? (
            <>
              <ReviewRow label={shipping.departmentLabel} value={values.department} />
              <ReviewRow label={shipping.cityLabel} value={values.city} />
              <ReviewRow label={shipping.neighborhoodLabel} value={values.neighborhood} />
              <ReviewRow label={shipping.addressLabel} value={values.address} />
              {values.reference ? (
                <ReviewRow label={shipping.referenceLabel} value={values.reference} />
              ) : null}
              <ReviewRow
                label={shipping.shippingCostLabel}
                value={
                  shippingSelection?.cost !== null && shippingSelection?.cost !== undefined
                    ? formatPrice(shippingSelection.cost)
                    : shipping.shippingCostToConfirm
                }
              />
              {shippingEstimatedDays ? (
                <ReviewRow
                  label={shipping.shippingEstimatedDaysLabel}
                  value={shippingEstimatedDays}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </ReviewSection>

      <ReviewSection title={payment.title}>
        <p className="text-sm font-medium text-foreground">
          {values.paymentMethod === "cash" ? payment.cashOption : payment.transferOption}
        </p>
      </ReviewSection>

      {values.notes.trim() ? (
        <ReviewSection title={siteConfig.checkoutPage.orderNotes.title}>
          <p className="text-sm text-foreground whitespace-pre-wrap">{values.notes}</p>
        </ReviewSection>
      ) : null}

      {submitError ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{submitError}</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Continuar de todas formas por WhatsApp, sin guardar el pedido
          </a>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/checkout")}
          disabled={isSubmitting}
        >
          {t.backButton}
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={isSubmitting || !whatsappNumber}
          nativeButton={false}
          render={<a href={whatsappUrl} onClick={handleConfirm} />}
        >
          {isSubmitting ? "Guardando pedido..." : t.confirmButton}
        </Button>
      </div>
    </div>
  );
}
