import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/categories/CategoryForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Editar categoría · Panel administrativo | ${siteConfig.name}`,
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar categoría</h1>
        <p className="text-muted-foreground">Actualizá los datos y guardá los cambios.</p>
      </div>
      <CategoryForm mode="edit" categoryId={id} />
    </div>
  );
}
