import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { businessConfig } from "@/config/business"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWhatsAppUrl(phoneNumber: string, message: string) {
  const params = new URLSearchParams({ text: message })
  return `https://wa.me/${phoneNumber}?${params.toString()}`
}

/**
 * Con coordenadas (Sprint 5.5, business_settings.map_default_lat/lng) el
 * link es más preciso que una búsqueda por texto -- se usan cuando están
 * disponibles, con la dirección en texto como respaldo si no.
 */
export function getGoogleMapsUrl(address: string, coords?: { lat: number; lng: number }) {
  const query = coords ? `${coords.lat},${coords.lng}` : address
  const params = new URLSearchParams({ api: "1", query })
  return `https://www.google.com/maps/search/?${params.toString()}`
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat(businessConfig.locale, {
    style: "currency",
    currency: businessConfig.currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Usado por el panel de Pedidos (Sprint 5.6) -- mismo criterio que
 * formatPrice: locale desde config/business.ts (ver excepción documentada
 * en la Fase 14, CLAUDE.md sección 9). */
export function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat(businessConfig.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateIso))
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
