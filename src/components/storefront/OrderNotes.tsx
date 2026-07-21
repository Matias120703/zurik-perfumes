import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import type { CheckoutFieldChange } from "@/lib/checkout";

export function OrderNotes({
  value,
  onChange,
}: {
  value: string;
  onChange: CheckoutFieldChange;
}) {
  const t = siteConfig.checkoutPage.orderNotes;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
      <Textarea
        rows={3}
        placeholder={t.placeholder}
        value={value}
        onChange={(event) => onChange("notes", event.target.value)}
      />
    </section>
  );
}
