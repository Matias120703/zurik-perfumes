import { FormField } from "@/components/shared/FormField";
import { LocationPicker } from "@/components/storefront/LocationPicker";
import { ShippingCitySelect } from "@/components/storefront/ShippingCitySelect";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { siteConfig } from "@/config/site";
import type { CheckoutFieldChange, CheckoutFormValues, DeliveryMethod } from "@/lib/checkout";
import { cn } from "@/lib/utils";

export function ShippingInformation({
  values,
  onChange,
}: {
  values: Pick<
    CheckoutFormValues,
    "deliveryMethod" | "department" | "city" | "neighborhood" | "address" | "reference"
  >;
  onChange: CheckoutFieldChange;
}) {
  const t = siteConfig.checkoutPage.shippingInformation;
  const isPickup = values.deliveryMethod === "pickup";

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-foreground">{t.deliveryMethodLabel}</span>
        <RadioGroup
          value={values.deliveryMethod}
          onValueChange={(value) => onChange("deliveryMethod", value as DeliveryMethod)}
          className="flex flex-col gap-3 sm:flex-row sm:gap-6"
        >
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="delivery" />
            {t.deliveryOption}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="pickup" />
            {t.pickupOption}
          </label>
        </RadioGroup>
      </div>

      {/*
        "Retiro en tienda" oculta los campos de dirección sin desmontarlos:
        así, si el usuario vuelve a elegir "Delivery", lo que ya escribió
        sigue ahí. disabled además los excluye de la validación nativa
        mientras están ocultos.
      */}
      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", isPickup && "hidden")}>
        <ShippingCitySelect
          department={values.department}
          city={values.city}
          disabled={isPickup}
          onChange={onChange}
        />

        <FormField label={t.neighborhoodLabel} htmlFor="neighborhood" required={!isPickup}>
          <Input
            id="neighborhood"
            required={!isPickup}
            disabled={isPickup}
            value={values.neighborhood}
            onChange={(event) => onChange("neighborhood", event.target.value)}
          />
        </FormField>

        <FormField label={t.addressLabel} htmlFor="address" required={!isPickup}>
          <Input
            id="address"
            required={!isPickup}
            disabled={isPickup}
            value={values.address}
            onChange={(event) => onChange("address", event.target.value)}
          />
        </FormField>

        <FormField label={t.referenceLabel} htmlFor="reference" className="sm:col-span-2">
          <Input
            id="reference"
            disabled={isPickup}
            value={values.reference}
            onChange={(event) => onChange("reference", event.target.value)}
          />
        </FormField>
      </div>

      {/*
        A diferencia de los campos de arriba, el mapa se desmonta por completo
        en "Retiro en tienda" (no solo se oculta con CSS): Leaflet no debe
        inicializarse dentro de un contenedor oculto/0px. La ubicación ya
        elegida no se pierde porque vive en useCheckoutStore, no acá.
      */}
      {!isPickup ? <LocationPicker /> : null}
    </section>
  );
}
