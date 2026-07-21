import type { Metadata } from "next";

import { InventoryDetailView } from "@/components/admin/inventory/InventoryDetailView";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Movimientos de inventario · Panel administrativo | ${siteConfig.name}`,
};

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InventoryDetailView productId={id} />;
}
