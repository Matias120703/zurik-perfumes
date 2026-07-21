export type Product = {
  id: string;
  name: string;
  slug: string;
  /** Slug de una categoría definida en config/categories.ts */
  category: string;
  shortDescription: string;
  /**
   * Descripción enriquecida (HTML sanitizado), Sprint 6.3 -- solo la
   * página individual de producto la muestra (`ProductRichDescription.tsx`).
   * Opcional y sin valor en `products` (el array mock): `getPublicProducts()`/
   * `getPublicHeroProducts()` no la seleccionan a propósito (evita traer
   * HTML potencialmente pesado en el catálogo/Home/destacados) -- solo
   * `getPublicProductBySlug()` la resuelve.
   */
  description?: string;
  price: number;
  oldPrice?: number;
  /**
   * Reservado para las fotos reales del cliente (aún no se usan: se
   * renderiza un placeholder). El array ya soporta múltiples imágenes
   * para la galería de la página de producto.
   */
  images: string[];
  featured: boolean;
  onSale: boolean;
  stock: number;
  badge?: string;
};

export const products: Product[] = [
  {
    id: "iphone-14",
    name: "iPhone 14",
    slug: "iphone-14",
    category: "tecnologia",
    shortDescription: "Pantalla Super Retina y cámara profesional en un diseño icónico.",
    price: 850000,
    oldPrice: 950000,
    images: [
      "/products/iphone-14-1.jpg",
      "/products/iphone-14-2.jpg",
      "/products/iphone-14-3.jpg",
    ],
    featured: true,
    onSale: true,
    stock: 8,
  },
  {
    id: "airpods-pro",
    name: "AirPods Pro",
    slug: "airpods-pro",
    category: "tecnologia",
    shortDescription: "Cancelación activa de ruido y audio espacial personalizado.",
    price: 210000,
    images: [
      "/products/airpods-pro-1.jpg",
      "/products/airpods-pro-2.jpg",
      "/products/airpods-pro-3.jpg",
    ],
    featured: true,
    onSale: false,
    stock: 15,
    badge: "Más vendido",
  },
  {
    id: "smart-watch",
    name: "Smart Watch",
    slug: "smart-watch",
    category: "tecnologia",
    shortDescription: "Monitoreo de salud y notificaciones en tu muñeca.",
    price: 180000,
    oldPrice: 220000,
    images: [
      "/products/smart-watch-1.jpg",
      "/products/smart-watch-2.jpg",
      "/products/smart-watch-3.jpg",
    ],
    featured: true,
    onSale: true,
    stock: 3,
  },
  {
    id: "licuadora",
    name: "Licuadora",
    slug: "licuadora",
    category: "hogar",
    shortDescription: "Potencia y versatilidad para tu cocina de todos los días.",
    price: 65000,
    images: ["/products/licuadora-1.jpg", "/products/licuadora-2.jpg", "/products/licuadora-3.jpg"],
    featured: true,
    onSale: false,
    stock: 20,
    badge: "Nuevo",
  },
  {
    id: "aspiradora",
    name: "Aspiradora",
    slug: "aspiradora",
    category: "hogar",
    shortDescription: "Succión potente y diseño liviano para toda la casa.",
    price: 120000,
    oldPrice: 145000,
    images: [
      "/products/aspiradora-1.jpg",
      "/products/aspiradora-2.jpg",
      "/products/aspiradora-3.jpg",
    ],
    featured: true,
    onSale: true,
    stock: 0,
  },
  {
    id: "auriculares-bluetooth",
    name: "Auriculares Bluetooth",
    slug: "auriculares-bluetooth",
    category: "accesorios",
    shortDescription: "Sonido envolvente con batería de larga duración.",
    price: 45000,
    images: [
      "/products/auriculares-bluetooth-1.jpg",
      "/products/auriculares-bluetooth-2.jpg",
      "/products/auriculares-bluetooth-3.jpg",
    ],
    featured: true,
    onSale: false,
    stock: 30,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}
