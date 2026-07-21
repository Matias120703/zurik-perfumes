import type { Metadata } from "next";

import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Pedidos · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminOrdersPage() {
  return <OrdersTable />;
}
