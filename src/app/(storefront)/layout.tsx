import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getStorefrontThemeStyle } from "@/lib/theme";
import { getPublicBusinessSettings } from "@/services/storefront/business";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * `generateMetadata` (dinámico) reemplaza el `export const metadata`
 * estático desde el Sprint 5.5: nombre y descripción ya no vienen de
 * `siteConfig.name`/`siteConfig.description`, sino de `business_settings`
 * (Home/Header/Footer los pasan por prop -- acá se resuelven una vez más,
 * mismo patrón ya establecido para `/productos/[slug]` en la Fase 13,
 * porque un layout no puede recibir props de sus páginas hijas).
 *
 * Favicon: `app/favicon.ico` se movió a `public/favicon-default.ico` en
 * este mismo sprint -- Next.js genera SIEMPRE su propio <link rel="icon">
 * para el archivo especial `app/favicon.ico`, sin importar lo que diga
 * `metadata.icons` (son dos mecanismos independientes, no uno
 * sobreescribe al otro), así que mientras existiera ese archivo, un
 * favicon subido desde el panel nunca podía ganarle de forma confiable.
 * Sacándolo de esa convención especial, `metadata.icons` pasa a ser la
 * única fuente: `favicon_url` si el cliente subió uno, o
 * `/favicon-default.ico` (el mismo archivo de siempre, servido como
 * estático desde `public/`) si no.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicBusinessSettings();
  return {
    title: settings.storeName,
    description: settings.storeDescription ?? undefined,
    icons: { icon: settings.faviconUrl ?? "/favicon-default.ico" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicBusinessSettings();

  /**
   * Tema de marca ("Colores del tema", /admin/configuracion -> Apariencia):
   * se resuelve acá, server-side, y se aplica como `style` inline en
   * <html> -- el mismo mecanismo ya usado para el logo/favicon dinámicos
   * (Fase 14), aplicado ahora a color en vez de a una URL de imagen. Al
   * quedar en el HTML que manda el servidor desde el primer byte, no hay
   * ningún flash de color por defecto antes del real (a diferencia de un
   * ThemeProvider de cliente, que solo podría aplicar el color después de
   * hidratar). Sin colores configurados (null), `getStorefrontThemeStyle`
   * devuelve un objeto vacío -- `style={{}}` no cambia nada, y
   * `globals.css` sigue aplicando los mismos valores de siempre.
   */
  const themeStyle = getStorefrontThemeStyle({
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    accentColor: settings.accentColor,
  });

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={themeStyle}
    >
      <body className="antialiased">
        <Header settings={settings} />
        {children}
        <Footer settings={settings} />
      </body>
    </html>
  );
}
