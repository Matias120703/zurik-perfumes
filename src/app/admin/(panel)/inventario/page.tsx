import type { Metadata } from "next";

import { InventoryTable } from "@/components/admin/inventory/InventoryTable";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Inventario · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminInventoryPage() {
  return <InventoryTable />;
}
