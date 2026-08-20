import type { Metadata } from "next";

import { PaymentMethodsManager } from "@/components/admin/payments/PaymentMethodsManager";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Métodos de pago · Panel administrativo | ${siteConfig.name}`,
};

export default function AdminPaymentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Métodos de pago</h1>
        <p className="text-muted-foreground">
          Definí cómo puede pagar tu cliente y, en los que hagan falta, a qué cuenta transferir.
        </p>
      </div>
      <PaymentMethodsManager />
    </div>
  );
}
