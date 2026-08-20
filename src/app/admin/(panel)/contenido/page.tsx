import type { Metadata } from "next";

import { HomeContentForm } from "@/components/admin/content/HomeContentForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Contenido · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminContentPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Contenido de la tienda</h1>
        <p className="text-muted-foreground">
          Todo lo que se lee en la portada: anuncios, textos principales, el bloque mayorista y
          las garantías. Se actualiza en la tienda apenas guardás.
        </p>
      </div>
      <HomeContentForm />
    </div>
  );
}
