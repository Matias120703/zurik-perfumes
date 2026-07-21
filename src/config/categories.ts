export type Category = {
  id: string;
  name: string;
  slug: string;
  /** URL absoluta de Supabase Storage (Sprint 6.6) cuando la categoría
   * tiene una foto real subida desde el Panel, o una ruta de placeholder
   * heredada del seed original que nunca existió como archivo -- `CategoryCard`
   * distingue ambos casos con `isRealImageUrl` y cae al placeholder
   * decorativo cuando no hay foto real. */
  image: string;
  description: string;
  /** Color de acento opcional en hex, usado sutilmente en el placeholder de la tarjeta. */
  accentColor?: string;
};

export const categories: Category[] = [
  {
    id: "tecnologia",
    name: "Tecnología",
    slug: "tecnologia",
    image: "/categories/tecnologia.jpg",
    description: "Gadgets y dispositivos para el día a día.",
    accentColor: "#3B82F6",
  },
  {
    id: "hogar",
    name: "Hogar",
    slug: "hogar",
    image: "/categories/hogar.jpg",
    description: "Todo para equipar tu casa con estilo.",
    accentColor: "#D97706",
  },
  {
    id: "belleza",
    name: "Belleza",
    slug: "belleza",
    image: "/categories/belleza.jpg",
    description: "Cuidado personal y productos de belleza.",
    accentColor: "#E11D8F",
  },
  {
    id: "deportes",
    name: "Deportes",
    slug: "deportes",
    image: "/categories/deportes.jpg",
    description: "Equipamiento para mantenerte activo.",
    accentColor: "#059669",
  },
  {
    id: "juguetes",
    name: "Juguetes",
    slug: "juguetes",
    image: "/categories/juguetes.jpg",
    description: "Diversión para todas las edades.",
    accentColor: "#7C3AED",
  },
  {
    id: "accesorios",
    name: "Accesorios",
    slug: "accesorios",
    image: "/categories/accesorios.jpg",
    description: "Detalles que completan tu look.",
    accentColor: "#475569",
  },
];
