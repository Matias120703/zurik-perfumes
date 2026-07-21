import type { Metadata } from "next";

import { PromotionsTable } from "@/components/admin/promotions/PromotionsTable";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Promociones · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminPromotionsPage() {
  return <PromotionsTable />;
}
