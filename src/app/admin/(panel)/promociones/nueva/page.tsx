import type { Metadata } from "next";

import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Nueva promoción · Panel administrativo | ${siteConfig.name}`,
};

export default function NewPromotionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nueva promoción</h1>
        <p className="text-muted-foreground">Completá los datos para armar la campaña de descuento.</p>
      </div>
      <PromotionForm mode="create" />
    </div>
  );
}
