"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

import type { BusinessSettings } from "@/services/storefront/business";
import { getWhatsAppUrl } from "@/lib/utils";

/**
 * Botón flotante de WhatsApp -- el canal real de venta de la tienda
 * (todo el checkout termina ahí), así que conviene tenerlo a un toque
 * desde cualquier página.
 *
 * Se oculta en /checkout y /carrito a propósito: en esas dos pantallas el
 * objetivo es terminar la compra, y un botón flotante que abre otra app
 * compite con el botón principal en vez de ayudar.
 */
export function FloatingWhatsApp({ settings }: { settings: BusinessSettings }) {
  const pathname = usePathname();
  const isCheckoutFlow = pathname.startsWith("/checkout") || pathname === "/carrito";

  if (isCheckoutFlow) return null;

  const href = getWhatsAppUrl(settings.whatsappNumber, settings.whatsappDefaultMessage);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] py-3 pr-4 pl-3.5 text-sm font-semibold text-[#0B1F14] shadow-lg shadow-black/30 transition-transform duration-200 hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none sm:right-6 sm:bottom-6"
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      {/* El texto sólo aparece en pantallas grandes: en mobile compite con
          el contenido y el ícono ya se entiende solo. */}
      <span className="hidden sm:inline">Escribinos</span>
    </a>
  );
}
