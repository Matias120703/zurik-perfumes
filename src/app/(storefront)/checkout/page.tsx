"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import { CheckoutSummary } from "@/components/storefront/CheckoutSummary";
import { siteConfig } from "@/config/site";
import { useCartStore } from "@/store/cart-store";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);

  // Sin productos no hay nada que pagar: se manda de vuelta al carrito
  // en vez de mostrar un checkout vacío.
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/carrito");
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return null;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Carrito", href: "/carrito" },
          { label: "Checkout" },
        ]}
      />

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {siteConfig.checkoutPage.title}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
        <CheckoutForm />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <CheckoutSummary />
        </div>
      </div>
    </main>
  );
}
