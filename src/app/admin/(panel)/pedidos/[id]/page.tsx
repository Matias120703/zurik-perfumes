import type { Metadata } from "next";

import { OrderDetailView } from "@/components/admin/orders/OrderDetailView";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Detalle de pedido · Panel administrativo | ${siteConfig.name}`,
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
