export const businessConfig = {
  // Placeholder de ZURIK Perfumería -- reemplazar por el WhatsApp real del
  // negocio. formatPrice()/el mapa de Checkout siguen leyendo este archivo
  // directamente (excepción documentada, CLAUDE.md sección 9, Fase 14).
  whatsapp: {
    number: "595900000000",
    defaultMessage: "Hola, quiero hacer una consulta.",
    /** {product} se reemplaza por el nombre del producto consultado. */
    productInquiryTemplate: "Hola, quiero consultar por {product}.",
  },
  currency: "PYG",
  locale: "es-PY",
  map: {
    /** Centro inicial del mapa de selección de ubicación (Asunción, Paraguay -- placeholder neutral, ajustar a la ciudad real de Zurik). */
    defaultCenter: { lat: -25.2637, lng: -57.5759 },
    defaultZoom: 12,
  },
} as const;
