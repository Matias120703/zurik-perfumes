import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/products/ProductForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Editar producto · Panel administrativo | ${siteConfig.name}`,
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar producto</h1>
        <p className="text-muted-foreground">Actualizá los datos y guardá los cambios.</p>
      </div>
      <ProductForm mode="edit" productId={id} />
    </div>
  );
}
