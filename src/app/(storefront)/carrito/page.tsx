"use client";

import { AnimatePresence } from "framer-motion";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { CartItem } from "@/components/storefront/CartItem";
import { EmptyCart } from "@/components/storefront/EmptyCart";
import { OrderSummary } from "@/components/storefront/OrderSummary";
import { siteConfig } from "@/config/site";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const items = useCartStore((state) => state.items);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Carrito" }]} />

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {siteConfig.cartPage.title}
      </h1>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
            <div className="flex flex-col">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <CartItem key={item.product.id} item={item} />
                ))}
              </AnimatePresence>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start">
              <OrderSummary />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
