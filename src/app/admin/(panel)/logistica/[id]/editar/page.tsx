import type { Metadata } from "next";

import { ShippingRateForm } from "@/components/admin/logistics/ShippingRateForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Editar tarifa de envío · Panel administrativo | ${siteConfig.name}`,
};

export default async function EditShippingRatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar tarifa de envío</h1>
        <p className="text-muted-foreground">Actualizá los datos y guardá los cambios.</p>
      </div>
      <ShippingRateForm mode="edit" rateId={id} />
    </div>
  );
}
