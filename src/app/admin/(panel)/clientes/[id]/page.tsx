import type { Metadata } from "next";

import { CustomerDetailView } from "@/components/admin/customers/CustomerDetailView";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Detalle de cliente · Panel administrativo | ${siteConfig.name}`,
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetailView customerId={id} />;
}
