import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { siteConfig } from "@/config/site";
import type { CheckoutFieldChange, PaymentMethodValue } from "@/lib/checkout";

export function PaymentMethod({
  value,
  onChange,
}: {
  value: PaymentMethodValue;
  onChange: CheckoutFieldChange;
}) {
  const t = siteConfig.checkoutPage.paymentMethod;

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>

      <RadioGroup
        value={value}
        onValueChange={(next) => onChange("paymentMethod", next as PaymentMethodValue)}
        className="flex flex-col gap-3"
      >
        <label className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm text-foreground transition-colors has-[[data-checked]]:border-foreground">
          <RadioGroupItem value="transfer" />
          {t.transferOption}
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm text-foreground transition-colors has-[[data-checked]]:border-foreground">
          <RadioGroupItem value="cash" />
          {t.cashOption}
        </label>
      </RadioGroup>
    </section>
  );
}
