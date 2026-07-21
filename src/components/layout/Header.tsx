"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, MessageCircle, Search, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import type { BusinessSettings } from "@/services/storefront/business";
import { cn, getWhatsAppUrl } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function Header({ settings }: { settings: BusinessSettings }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // framer-motion's useReducedMotion() lee window.matchMedia de forma
  // sincrónica en el primer render del cliente (fuera de un efecto), pero
  // en el servidor -- sin window -- siempre devuelve un valor "falsy". Si
  // el sistema operativo de quien visita tiene "reducir movimiento"
  // activado, el cliente devuelve `true` desde ese primerísimo render, el
  // que React usa para comparar contra el HTML del servidor -- y como acá
  // se usa para elegir entre dos `initial` distintos (que Framer Motion
  // aplica como estilos inline), esa primera pasada del cliente ya no
  // coincide con lo que el servidor mandó, y React tira el mismatch de
  // hidratación. `mounted` fuerza a que ese primer render del cliente
  // sea idéntico al del servidor (mismo `initial` de siempre); recién en
  // el render siguiente -- ya después de hidratar, disparado por el
  // propio setState del efecto -- se aplica la preferencia real de
  // movimiento reducido.
  const [mounted, setMounted] = useState(false);

  const whatsappHref = getWhatsAppUrl(settings.whatsappNumber, settings.whatsappDefaultMessage);
  const showLogo = Boolean(settings.logoUrl);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={mounted && shouldReduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,padding] duration-300",
        isScrolled
          ? "border-b border-border bg-background/80 py-3 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-background/0 py-5"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {showLogo ? (
            <Image
              src={settings.logoUrl!}
              alt={settings.storeName}
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          ) : (
            <span className="text-xl font-bold tracking-tight text-foreground">
              {settings.storeName}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <SearchInput inputClassName="w-56" />

          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" />
            }
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </Button>

          <CartButton />
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <CartButton />

          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" aria-label="Abrir menú" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{settings.storeName}</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4 pb-6">
                <SearchInput />

                <nav className="flex flex-col gap-1">
                  {mainNav.map((item) => (
                    <SheetClose
                      key={item.href}
                      nativeButton={false}
                      render={
                        <Link
                          href={item.href}
                          className="rounded-md px-2 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted"
                        />
                      }
                    >
                      {item.label}
                    </SheetClose>
                  ))}
                </nav>

                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}

function CartButton() {
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <Button
      variant="ghost"
      size="icon"
      nativeButton={false}
      aria-label={`Ver carrito (${totalItems} productos)`}
      render={<Link href="/carrito" />}
    >
      <span className="relative inline-flex">
        <ShoppingCart className="size-5" />
        <Badge
          aria-hidden="true"
          className="absolute -top-2 -right-2 h-4 min-w-4 rounded-full px-1 text-[10px] tabular-nums"
        >
          {totalItems}
        </Badge>
      </span>
    </Button>
  );
}

/**
 * Único buscador de la tienda: vive en el Header porque es el único lugar
 * donde ya existía (visualmente) desde antes. Al tipear, lleva a
 * /productos?q=... — si ya estamos en /productos O en una categoría
 * (/categorias/[slug], Sprint 4.4), con router.replace sobre esa misma
 * ruta (sin apilar historial por cada letra, y sin perder el filtro de
 * categoría); si no, con router.push a /productos. CatalogResults es
 * quien realmente filtra, leyendo ese mismo "q" con useSearchParams.
 *
 * A propósito NO usa useSearchParams acá: ese hook obliga a envolver en
 * Suspense a quien lo usa, y Header se renderiza en el layout raíz, en
 * TODAS las páginas — hacerlo ahí forzaría a toda la app a renderizado
 * dinámico. En cambio, lee "q" una sola vez desde window.location.search
 * al montar (guardado detrás de un chequeo de `typeof window`, mismo
 * patrón ya usado para Leaflet en el Sprint 3.7).
 */
function SearchInput({ inputClassName }: { inputClassName?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isOnCatalog = pathname === "/productos" || pathname.startsWith("/categorias/");
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined" || !isOnCatalog) return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });

  function handleChange(next: string) {
    setValue(next);

    const params = new URLSearchParams();
    if (next.trim()) params.set("q", next);
    const query = params.toString();
    const basePath = isOnCatalog ? pathname : "/productos";
    const href = query ? `${basePath}?${query}` : basePath;

    if (isOnCatalog) {
      router.replace(href, { scroll: false });
    } else {
      router.push(href);
    }
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={siteConfig.search.placeholder}
        aria-label="Buscar productos"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className={cn("pl-9", inputClassName)}
      />
    </div>
  );
}
