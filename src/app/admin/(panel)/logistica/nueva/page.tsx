import type { Metadata } from "next";

import { ShippingRateForm } from "@/components/admin/logistics/ShippingRateForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Nueva tarifa de envío · Panel administrativo | ${siteConfig.name}`,
};

export default function NewShippingRatePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nueva tarifa de envío</h1>
        <p className="text-muted-foreground">
          Completá los datos y elegí las ciudades que cubre esta tarifa.
        </p>
      </div>
      <ShippingRateForm mode="create" />
    </div>
  );
}
