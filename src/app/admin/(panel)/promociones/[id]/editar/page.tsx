import type { Metadata } from "next";

import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Editar promoción · Panel administrativo | ${siteConfig.name}`,
};

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar promoción</h1>
        <p className="text-muted-foreground">Actualizá los datos y guardá los cambios.</p>
      </div>
      <PromotionForm mode="edit" promotionId={id} />
    </div>
  );
}
