import type { SVGProps } from "react";

/**
 * lucide-react ya no incluye íconos de marca (Instagram, Facebook, etc.).
 * Estos son glyphs genéricos simples, con el mismo estilo visual que el
 * resto de los íconos de la app, para no depender de una librería extra.
 */

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

/** Sumado en el Sprint 5.5 (Configuración General, red social nueva) --
 * mismo criterio que Instagram/Facebook: glyph propio, sin depender de
 * una librería de íconos de marca. */
export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M16.6 5.82c-.85-.93-1.32-2.15-1.32-3.42h-3.05v13.44a2.6 2.6 0 0 1-2.6 2.5 2.6 2.6 0 0 1-2.6-2.6c0-1.55 1.36-2.77 2.9-2.6V9.99c-3.24-.27-6 2.28-6 5.55a5.6 5.6 0 0 0 5.7 5.6c3.1 0 5.6-2.5 5.6-5.6V9.34a7.8 7.8 0 0 0 4.5 1.43V7.72a4.7 4.7 0 0 1-3.13-1.9z" />
    </svg>
  );
}
