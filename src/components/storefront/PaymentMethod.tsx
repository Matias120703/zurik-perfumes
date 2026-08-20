"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Info } from "lucide-react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { siteConfig } from "@/config/site";
import type { CheckoutFieldChange, PaymentMethodValue } from "@/lib/checkout";
import type { PaymentMethod as PaymentMethodOption } from "@/lib/payment-methods";
import { getPublicPaymentMethods } from "@/services/storefront/payment-methods";
import { useCheckoutStore } from "@/store/checkout-store";

/**
 * Los métodos de pago dejaron de estar hardcodeados: se traen de
 * `payment_methods` (administrables desde /admin/pagos). El método que
 * tenga instrucciones cargadas (datos bancarios, alias, número de
 * billetera) las muestra acá mismo, con un botón para copiarlas -- antes
 * el cliente elegía "Transferencia bancaria" y no tenía forma de saber a
 * qué cuenta transferir sin preguntarlo por WhatsApp.
 *
 * El nombre y las instrucciones del método elegido se guardan en
 * `useCheckoutStore` (no sólo el id) porque la pantalla de confirmación,
 * el mensaje de WhatsApp y el pedido guardado los necesitan, y ninguno de
 * los tres vuelve a consultar Supabase. Mismo patrón que
 * `ShippingCitySelect` con la tarifa de envío.
 */
export function PaymentMethod({
  value,
  onChange,
}: {
  value: PaymentMethodValue;
  onChange: CheckoutFieldChange;
}) {
  const t = siteConfig.checkoutPage.paymentMethod;
  const setPaymentMethodDetails = useCheckoutStore((state) => state.setPaymentMethodDetails);

  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    getPublicPaymentMethods()
      .then((result) => {
        if (!active) return;
        setMethods(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar los métodos de pago."
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selected = methods.find((method) => method.id === value) ?? null;

  /**
   * Selecciona el primero apenas llega la lista, si todavía no hay nada
   * elegido (o si lo elegido dejó de existir porque el admin lo
   * desactivó mientras el cliente tenía el checkout abierto). Va en un
   * efecto y no en el render porque escribe en dos stores.
   */
  useEffect(() => {
    if (methods.length === 0) return;
    const stillValid = methods.some((method) => method.id === value);
    const next = stillValid ? methods.find((m) => m.id === value)! : methods[0];

    if (!stillValid) onChange("paymentMethod", next.id);
    setPaymentMethodDetails({ name: next.name, instructions: next.instructions });
    // `onChange`/`setPaymentMethodDetails` son estables (setField de Zustand
    // y el handler del formulario), no hace falta incluirlos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods, value]);

  function handleSelect(nextId: string) {
    onChange("paymentMethod", nextId);
    setCopied(false);
    const method = methods.find((option) => option.id === nextId);
    if (method) {
      setPaymentMethodDetails({ name: method.name, instructions: method.instructions });
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin portapapeles disponible (contexto no seguro, permiso
      // denegado): no se rompe nada, los datos siguen visibles y
      // seleccionables a mano.
      setCopied(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando métodos de pago...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : methods.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay métodos de pago configurados. Coordinamos el pago por WhatsApp al
          confirmar el pedido.
        </p>
      ) : (
        <>
          <RadioGroup
            value={value}
            onValueChange={(next) => handleSelect(String(next))}
            className="flex flex-col gap-3"
          >
            {methods.map((method) => (
              <label
                key={method.id}
                className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm text-foreground transition-colors has-[[data-checked]]:border-[var(--gold)]"
              >
                <RadioGroupItem value={method.id} />
                {method.name}
              </label>
            ))}
          </RadioGroup>

          {selected?.instructions?.trim() ? (
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--gold)]/30 bg-[color-mix(in_oklab,var(--gold)_8%,transparent)] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Info className="size-4 shrink-0 text-[var(--gold)]" aria-hidden="true" />
                  Datos para el pago
                </p>

                <button
                  type="button"
                  onClick={() => handleCopy(selected.instructions!.trim())}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-[var(--gold)]/40 hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" aria-hidden="true" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" aria-hidden="true" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              <p className="text-sm whitespace-pre-wrap text-foreground/90">
                {selected.instructions.trim()}
              </p>

              <p className="border-t border-[var(--gold)]/20 pt-3 text-xs text-muted-foreground">
                Al confirmar el pedido se abre WhatsApp con estos datos incluidos. Enviá el
                comprobante en ese mismo chat para que preparemos tu pedido.
              </p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
