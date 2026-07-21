export type PromotionBackgroundVariant = "dark" | "light";

export type PromotionConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  backgroundVariant: PromotionBackgroundVariant;
  /** Reservado para la imagen real del cliente (aún no se usa: se renderiza un placeholder). */
  image: string;
  badge?: string;
};

export const promotionConfig: PromotionConfig = {
  enabled: true,
  title: "Ofertas imperdibles de esta semana",
  subtitle:
    "Descubrí productos seleccionados con precios especiales por tiempo limitado.",
  buttonText: "Ver ofertas",
  buttonUrl: "/ofertas",
  backgroundVariant: "dark",
  image: "/promotions/weekly-offers.jpg",
  badge: "PROMOCIÓN",
};
