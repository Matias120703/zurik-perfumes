import type { Metadata } from "next";

import { SettingsForm } from "@/components/admin/settings/SettingsForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Configuración · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuración</h1>
        <p className="text-muted-foreground">
          Personalizá la identidad de tu tienda, conectada directamente a Supabase.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
