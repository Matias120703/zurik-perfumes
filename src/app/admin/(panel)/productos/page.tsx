import type { Metadata } from "next";

import { ProductsTable } from "@/components/admin/products/ProductsTable";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Productos · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminProductsPage() {
  return <ProductsTable />;
}
