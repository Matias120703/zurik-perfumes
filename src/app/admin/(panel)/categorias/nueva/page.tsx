import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/categories/CategoryForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Nueva categoría · Panel administrativo | ${siteConfig.name}`,
};

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nueva categoría</h1>
        <p className="text-muted-foreground">Completá los datos para agregarla al catálogo.</p>
      </div>
      <CategoryForm mode="create" />
    </div>
  );
}
