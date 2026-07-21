import type { Metadata } from "next";

import { Dashboard } from "@/components/admin/dashboard/Dashboard";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Dashboard · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminDashboardPage() {
  return <Dashboard />;
}
