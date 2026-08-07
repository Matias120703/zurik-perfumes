import type { CSSProperties } from "react";

/**
 * Sistema centralizado del tema de marca (Sprint "Colores del tema",
 * /admin/configuracion -> Apariencia). Tres tokens nuevos, con prefijo
 * `--brand-` a propósito -- no reutilizan `--primary`/`--secondary`/
 * `--accent` de shadcn (`globals.css`), porque esos ya tienen un uso
 * interno establecido (ej. `--accent` es el highlight de hover de
 * `<Select>`, `components/ui/select.tsx`) que no debe cambiar de
 * significado solo porque un admin eligió un color de botón. Los
 * `--brand-*` son una capa aparte, que por defecto apuntan (vía `var()`,
 * en `globals.css`) a esos mismos tokens -- así que hasta que un admin
 * configure un color propio, todo se ve exactamente igual que hoy.
 */

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value.trim());
}

/**
 * Fallbacks para el formulario del panel -- coinciden con el valor
 * efectivo actual de `--primary`/`--secondary` en `globals.css`
 * (oklch(0.205 0 0) y oklch(0.97 0 0) respectivamente, aproximados a hex).
 * Nunca se escriben solos en la base -- son solo el valor que ve el admin
 * la primera vez que abre el formulario, antes de elegir su propio color.
 */
export const DEFAULT_PRIMARY_COLOR = "#171717";
export const DEFAULT_SECONDARY_COLOR = "#F5F5F5";
export const DEFAULT_ACCENT_COLOR = "#171717";

/**
 * Contraste automático (punto 6 del sprint): decide si el texto sobre un
 * color de fondo debe ser blanco o negro, a partir de la luminancia
 * relativa del color (fórmula estándar de WCAG 2.x). Sin librería nueva --
 * es aritmética simple sobre los 3 canales del hex.
 */
export function getContrastingTextColor(hex: string): "#000000" | "#ffffff" {
  if (!isValidHexColor(hex)) return "#ffffff";

  const normalized = hex.trim().slice(1);
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const toLinear = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

  const relativeLuminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return relativeLuminance > 0.5 ? "#000000" : "#ffffff";
}

export type StorefrontThemeColors = {
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
};

/**
 * Arma el `style` a aplicar en `<html>` desde el layout raíz de la tienda
 * (Server Component -- sin ningún JS de cliente, sin flash: el color ya
 * está en el primer HTML que manda el servidor). Solo sobreescribe la
 * variable de un color cuando `business_settings` tiene un valor real y
 * válido -- si es null (o inválido, por las dudas), no se toca nada y
 * `globals.css` sigue aplicando el mismo valor de siempre (punto 7:
 * "la tienda nunca debe quedar sin estilos").
 */
export function getStorefrontThemeStyle(colors: StorefrontThemeColors): CSSProperties {
  const style: Record<string, string> = {};

  if (colors.primaryColor && isValidHexColor(colors.primaryColor)) {
    style["--brand-primary"] = colors.primaryColor;
    style["--brand-primary-foreground"] = getContrastingTextColor(colors.primaryColor);
  }

  if (colors.secondaryColor && isValidHexColor(colors.secondaryColor)) {
    style["--brand-secondary"] = colors.secondaryColor;
    style["--brand-secondary-foreground"] = getContrastingTextColor(colors.secondaryColor);
  }

  if (colors.accentColor && isValidHexColor(colors.accentColor)) {
    style["--brand-accent"] = colors.accentColor;
    style["--brand-accent-foreground"] = getContrastingTextColor(colors.accentColor);
  }

  return style as CSSProperties;
}
