export type NavItem = {
  label: string;
  href: string;
};

/**
 * Reutilizado por el Header Y el Footer -- un solo lugar donde se define
 * la navegación principal.
 *
 * "Ofertas" va segundo, inmediatamente después de Inicio: es el enlace
 * con más intención de compra de toda la barra. "Marcas" apunta a
 * /categorias porque en esta tienda las categorías SON las marcas
 * (Rayhaan, Afnan, Rasasi) -- la etiqueta refleja cómo lo busca el
 * cliente, sin necesidad de cambiar la ruta ni el modelo de datos.
 */
export const mainNav: NavItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Perfumes", href: "/productos" },
  { label: "Marcas", href: "/categorias" },
  { label: "Contacto", href: "/contacto" },
];
