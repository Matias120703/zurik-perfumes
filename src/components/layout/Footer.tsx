"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/icons";
import { footerConfig } from "@/config/footer";
import { mainNav } from "@/config/navigation";
import type { BusinessSettings } from "@/services/storefront/business";
import { getWhatsAppUrl } from "@/lib/utils";

const linkClassName = "text-sm text-muted-foreground transition-colors hover:text-foreground";

/**
 * `footerConfig.social` (Sprint 2.7) queda sin consumidores desde el
 * Sprint 5.5 -- las redes ahora son 3 columnas nombradas en
 * `business_settings` (instagram_url/facebook_url/tiktok_url), no una
 * lista genérica, tal como lo pidió el sprint. Se arma acá, en vez de en
 * `services/storefront/business.ts`, porque es un detalle de presentación
 * (qué ícono le corresponde a cada red) -- mismo criterio que
 * `category-icons.ts` (Fase 13): la resolución a un componente vive en la
 * capa de presentación.
 */
function getSocialLinks(settings: BusinessSettings) {
  return [
    settings.instagramUrl ? { id: "instagram", label: "Instagram", href: settings.instagramUrl, icon: InstagramIcon } : null,
    settings.facebookUrl ? { id: "facebook", label: "Facebook", href: settings.facebookUrl, icon: FacebookIcon } : null,
    settings.tiktokUrl ? { id: "tiktok", label: "TikTok", href: settings.tiktokUrl, icon: TikTokIcon } : null,
  ].filter((link): link is NonNullable<typeof link> => link !== null);
}

export function Footer({ settings }: { settings: BusinessSettings }) {
  const currentYear = new Date().getFullYear();
  const whatsappHref = getWhatsAppUrl(settings.whatsappNumber, settings.whatsappDefaultMessage);
  const socialLinks = getSocialLinks(settings);

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" className="w-fit text-xl font-bold tracking-tight text-foreground">
              {settings.storeName}
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              {settings.storeDescription}
            </p>
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <social.icon className="size-4" />
                </motion.a>
              ))}
            </div>
          </div>

          <FooterColumn title="Navegación">
            {mainNav.map((navItem) => (
              <li key={navItem.href}>
                <Link href={navItem.href} className={linkClassName}>
                  {navItem.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Información">
            {footerConfig.legalLinks.map((link) => (
              <li key={link.id}>
                <Link href={link.href} className={linkClassName}>
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Contacto">
            <li>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={linkClassName}>
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.contactEmail}`} className={linkClassName}>
                {settings.contactEmail}
              </a>
            </li>
            <li className="text-sm text-muted-foreground">{settings.contactHours}</li>
            {settings.contactAddress ? (
              <li className="text-sm text-muted-foreground">{settings.contactAddress}</li>
            ) : null}
          </FooterColumn>
        </div>

        <div className="mt-14 flex flex-col items-center gap-2 border-t border-border pt-8 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {currentYear} {settings.storeName}. Todos los derechos reservados.
          </p>
          <p>Desarrollado por {footerConfig.developedBy}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  );
}
