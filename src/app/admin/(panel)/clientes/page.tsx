import type { Metadata } from "next";

import { CustomersTable } from "@/components/admin/customers/CustomersTable";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Clientes · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminCustomersPage() {
  return <CustomersTable />;
}
