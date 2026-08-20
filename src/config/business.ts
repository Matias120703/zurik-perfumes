export const businessConfig = {
  // El WhatsApp REAL de la tienda vive en `business_settings` (editable
  // desde /admin/configuracion) y es el que usan Header, Hero, Footer,
  // Contacto, la ficha de producto y el mensaje del pedido. Lo de acá
  // quedó sin ningún consumidor: se conserva como fallback documentado,
  // igual que config/products.ts (CLAUDE.md sección 9, Fase 11).
  whatsapp: {
    number: "595900000000",
    defaultMessage: "Hola, quiero hacer una consulta.",
    /** {product} se reemplaza por el nombre del producto consultado. */
    productInquiryTemplate: "Hola, quiero consultar por {product}.",
  },
  currency: "PYG",
  locale: "es-PY",
  map: {
    /**
     * Centro inicial del mapa de "Seleccionar ubicación exacta" del
     * checkout. Ciudad del Este, que es donde opera ZURIK
     * (`business_settings.map_city`) -- antes apuntaba a Asunción, a
     * 320 km, así que todo cliente que quisiera marcar su casa tenía que
     * arrastrar el mapa medio país antes de empezar.
     *
     * Sigue leyéndose de este archivo y no de `business_settings`:
     * migrarlo obliga a tocar Checkout/LocationPicker, excepción ya
     * documentada (CLAUDE.md sección 9, Fase 14).
     */
    defaultCenter: { lat: -25.5097, lng: -54.6111 },
    defaultZoom: 13,
  },
} as const;
