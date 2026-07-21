"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { CheckoutSummary } from "@/components/storefront/CheckoutSummary";
import { OrderConfirmationDetails } from "@/components/storefront/OrderConfirmationDetails";
import { siteConfig } from "@/config/site";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const values = useCheckoutStore((state) => state.values);
  const hasContactData = Boolean(values.firstName && values.phone);

  // Sin productos, no hay pedido que confirmar. Sin datos de contacto
  // (por ejemplo, si se entra directo a esta URL sin pasar por el
  // formulario), tampoco hay nada que mostrar todavía: se manda de
  // vuelta al paso correspondiente en vez de mostrar la pantalla vacía.
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/carrito");
      return;
    }
    if (!hasContactData) {
      router.replace("/checkout");
    }
  }, [items.length, hasContactData, router]);

  if (items.length === 0 || !hasContactData) {
    return null;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Carrito", href: "/carrito" },
          { label: "Checkout", href: "/checkout" },
          { label: siteConfig.confirmationPage.breadcrumbLabel },
        ]}
      />

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {siteConfig.confirmationPage.title}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
        <OrderConfirmationDetails values={values} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <CheckoutSummary />
        </div>
      </div>
    </main>
  );
}
