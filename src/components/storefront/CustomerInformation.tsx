import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import type { CheckoutFieldChange, CheckoutFormValues } from "@/lib/checkout";

export function CustomerInformation({
  values,
  onChange,
}: {
  values: Pick<CheckoutFormValues, "firstName" | "lastName" | "phone" | "email">;
  onChange: CheckoutFieldChange;
}) {
  const t = siteConfig.checkoutPage.customerInformation;

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={t.firstNameLabel} htmlFor="firstName" required>
          <Input
            id="firstName"
            required
            autoComplete="given-name"
            value={values.firstName}
            onChange={(event) => onChange("firstName", event.target.value)}
          />
        </FormField>

        <FormField label={t.lastNameLabel} htmlFor="lastName" required>
          <Input
            id="lastName"
            required
            autoComplete="family-name"
            value={values.lastName}
            onChange={(event) => onChange("lastName", event.target.value)}
          />
        </FormField>

        <FormField label={t.phoneLabel} htmlFor="phone" required>
          <Input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => onChange("phone", event.target.value)}
          />
        </FormField>

        <FormField label={t.emailLabel} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
          />
        </FormField>
      </div>
    </section>
  );
}
