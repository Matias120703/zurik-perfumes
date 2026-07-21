import type { ComponentType, SVGProps } from "react";

import { FacebookIcon, InstagramIcon } from "@/components/icons";

export type SocialLink = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export type FooterLink = {
  id: string;
  label: string;
  href: string;
};

export const footerConfig = {
  /** Bajada del negocio para el pie de página (puede diferir de la del Hero). */
  description:
    "Tu tienda online de confianza: productos verificados, atención personalizada y envíos a todo el país.",
  // Placeholders de ZURIK Perfumería -- reemplazar por las redes/contacto
  // reales. Sin consumidores activos en la tienda pública desde la Fase 14
  // (Footer lee nombre/contacto/redes reales desde business_settings) salvo
  // legalLinks/developedBy, que sí siguen usándose.
  social: [
    {
      id: "instagram",
      label: "Instagram",
      href: "https://instagram.com/zurikperfumeria",
      icon: InstagramIcon,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: "https://facebook.com/zurikperfumeria",
      icon: FacebookIcon,
    },
  ] as SocialLink[],
  legalLinks: [
    { id: "envios", label: "Políticas de envío", href: "/politicas/envios" },
    { id: "privacidad", label: "Privacidad", href: "/politicas/privacidad" },
    { id: "terminos", label: "Términos y condiciones", href: "/politicas/terminos" },
    { id: "faq", label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
  ] as FooterLink[],
  contact: {
    email: "hola@zurikperfumeria.com",
    hours: "Lun. a vie. de 9 a 18 hs.",
    address: "Asunción, Paraguay",
  },
  developedBy: "Somapp",
};
