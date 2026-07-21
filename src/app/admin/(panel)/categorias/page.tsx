import type { Metadata } from "next";

import { CategoriesTable } from "@/components/admin/categories/CategoriesTable";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Categorías · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminCategoriesPage() {
  return <CategoriesTable />;
}
