import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/products/ProductForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Nuevo producto · Panel administrativo | ${siteConfig.name}`,
};

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nuevo producto</h1>
        <p className="text-muted-foreground">Completá los datos para agregarlo al catálogo.</p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
