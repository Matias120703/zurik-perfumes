import sanitizeHtml from "sanitize-html";

/**
 * Sanitización compartida del HTML de `products.description` (Sprint 6.3,
 * editor enriquecido) -- el mismo archivo se llama desde dos lugares con
 * dos objetivos distintos:
 *  1. `ProductForm.tsx` (panel, cliente de browser): sanitiza justo antes
 *     de guardar, para que nunca se guarde HTML peligroso en Supabase.
 *  2. `ProductRichDescription.tsx` (tienda pública, servidor): sanitiza
 *     de nuevo antes de mostrarlo -- defensa en profundidad, por si el
 *     dato en la base cambiara alguna vez por otra vía.
 *
 * `sanitize-html` (no `dompurify`/`isomorphic-dompurify`) a propósito:
 * el primer intento con `isomorphic-dompurify` rompía el build de
 * producción con Turbopack -- depende de `jsdom` para correr en Node, y
 * Turbopack no lograba resolver los archivos internos de `jsdom`
 * (`default-stylesheet.css`) al "Collecting page data", con un path
 * inválido (`C:\ROOT\...`) -- un problema de bundling, no de código
 * propio. `sanitize-html` no depende de ningún DOM emulado (parsea el
 * string directamente, funciona igual en Node y en el navegador), así
 * que no tiene ese problema. De paso, permite algo que la lista blanca
 * anterior no garantizaba con la misma precisión: `allowedIframeHostnames`
 * restringe los `<iframe>` a dominios de YouTube explícitamente, no solo
 * a que el tag/atributo estén en la lista blanca.
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "mark",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "a",
  "span",
  "div",
  "img",
  "video",
  "source",
  "iframe",
];

const STYLE_ATTR = ["style"];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  span: STYLE_ATTR,
  mark: STYLE_ATTR,
  /* `@tiptap/extension-youtube` envuelve su <iframe> en
   * <div data-youtube-video>, y su parseHTML() exige exactamente ese
   * wrapper (`div[data-youtube-video] iframe`) para reconocer el embed al
   * releer el HTML guardado -- sin permitir el `div` acá (con únicamente
   * este atributo, sin `style`/`class`/manejadores de eventos), el iframe
   * quedaba suelto tras sanitizar y el editor ya no lo reconocía como
   * video de YouTube al reabrir el producto (bug real encontrado durante
   * la verificación del round-trip de este sprint). */
  div: ["data-youtube-video"],
  img: [...STYLE_ATTR, "src", "alt", "title", "data-align"],
  video: [...STYLE_ATTR, "src", "controls", "data-align"],
  source: ["src", "type"],
  iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen", "title"],
};

const COLOR_VALUE = [/^#[0-9a-fA-F]{3,8}$/, /^rgba?\([0-9.,%\s]+\)$/];

const ALLOWED_STYLES: NonNullable<sanitizeHtml.IOptions["allowedStyles"]> = {
  "*": {
    width: [/^\d+(\.\d+)?(px|%)$/],
    height: [/^auto$/, /^\d+(\.\d+)?(px|%)$/],
    display: [/^block$/],
    /* El navegador normaliza "0" a "0px" en el estilo inline -- sin
     * aceptar esa forma acá, sanitize-html descartaba silenciosamente el
     * lado "0" de una imagen alineada a la izquierda/derecha (el lado
     * "auto" sí pasaba). No rompía el resultado visual porque el margen
     * inicial de un bloque ya es 0 por default del navegador, pero no
     * hay que depender de esa coincidencia. */
    "margin-left": [/^(0|0px|auto)$/],
    "margin-right": [/^(0|0px|auto)$/],
    color: COLOR_VALUE,
    "background-color": COLOR_VALUE,
  },
};

/** Igual que ya usa `@tiptap/extension-youtube` para armar el `src` del
 * embed -- ningún control del editor arma un iframe con otro dominio. */
const ALLOWED_IFRAME_HOSTNAMES = ["www.youtube.com", "www.youtube-nocookie.com"];

export function sanitizeDescriptionHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTNAMES,
    allowedSchemes: ["http", "https", "mailto"],
    allowVulnerableTags: false,
  });
}

/**
 * Un editor de Tiptap "vacío" sigue devolviendo `<p></p>`, no un string
 * vacío -- sin este chequeo, `ProductForm.tsx` guardaría ese HTML inerte
 * como si fuera contenido real en vez de `null` (comportamiento de
 * `toRow()` en `services/products.ts` desde la Fase 10, sin cambios).
 * No alcanza con solo mirar el texto: una descripción que es únicamente
 * una imagen/video/embed (sin texto) es contenido real igual.
 */
export function isEmptyDescriptionHtml(html: string): boolean {
  const hasMedia = /<(img|video|iframe)\b/i.test(html);
  if (hasMedia) return false;
  const textOnly = html.replace(/<[^>]*>/g, "").trim();
  return textOnly.length === 0;
}
