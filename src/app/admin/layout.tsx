import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

import { siteConfig } from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `Panel administrativo | ${siteConfig.name}`,
  description: `Panel administrativo de ${siteConfig.name}.`,
  /**
   * Estático a propósito (no lee `favicon_url` de business_settings): el
   * panel no es de cara al cliente, no necesita reflejar el branding de
   * cada negocio. `app/favicon.ico` se movió a `public/favicon-default.ico`
   * en el Sprint 5.5 (ver `(storefront)/layout.tsx`) -- sin esta
   * referencia explícita, el panel se quedaría sin ningún favicon.
   */
  icons: { icon: "/favicon-default.ico" },
};

/**
 * Root layout propio para /admin -- necesario porque el panel no debe
 * mostrar el Header/Footer del storefront (ver app/(storefront)/layout.tsx).
 * Next.js no permite "saltear" el layout de un ancestro, así que la única
 * forma correcta de tener dos shells distintos (tienda pública vs panel)
 * es que cada uno sea su propia raíz -- de ahí el route group
 * "(storefront)" al mismo nivel que "admin". Mismas fuentes (Geist) y
 * mismo globals.css que la tienda, para mantener la identidad visual
 * (paleta oklch, tipografía) exigida en este sprint; el Header/Sidebar
 * propios del panel viven recién en admin/(panel)/layout.tsx.
 */
export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
