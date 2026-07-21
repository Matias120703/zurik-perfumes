import type { Metadata } from "next";

import { ShippingRatesTable } from "@/components/admin/logistics/ShippingRatesTable";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Logística · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminLogisticsPage() {
  return <ShippingRatesTable />;
}
