export const siteConfig = {
  name: "ZURIK Perfumería",
  description:
    "Perfumes árabes y de nicho 100% originales. Envíos a todo Paraguay y precios mayoristas.",
  /**
   * El hero real de la Home lee `home_content` (editable desde
   * /admin/contenido). Lo que queda acá es el fallback: los textos que
   * se muestran si esa fila todavía no tiene contenido cargado, más las
   * etiquetas de los botones, que no son contenido editorial.
   */
  hero: {
    eyebrow: "Perfumería árabe & de nicho",
    title: "Fragancias que se recuerdan",
    subtitle:
      "Perfumes originales de larga duración, con precios reales y atención directa por WhatsApp.",
    primaryCta: {
      label: "Ver perfumes",
      href: "/productos",
    },
    secondaryCta: {
      label: "Consultar",
    },
  },
  search: {
    placeholder: "Buscar perfumes...",
  },
  featuredCategoriesSection: {
    eyebrow: "Marcas",
    title: "Explorá por marca",
    subtitle:
      "Rayhaan, Afnan, Rasasi y más. Entrá directo a la casa de fragancias que ya te gusta.",
  },
  featuredProductsSection: {
    eyebrow: "Selección ZURIK",
    title: "Fragancias destacadas",
    subtitle:
      "Los perfumes que más nos piden, elegidos uno por uno por su duración y su estela.",
  },
  productsPage: {
    title: "Todos los perfumes",
    description:
      "El catálogo completo de ZURIK: fragancias originales, con stock real y envío a todo el país.",
    emptyState: {
      title: "No hay perfumes disponibles",
      description: "Todavía no cargamos productos en esta sección. Volvé a visitarnos pronto.",
    },
    searchEmptyState: {
      title: "No encontramos perfumes para tu búsqueda",
      description: "Probá con el nombre de la fragancia o de la marca (Rayhaan, Afnan, Rasasi).",
    },
  },
  categoriesPage: {
    title: "Marcas",
    description:
      "Todas las casas de fragancias que trabajamos, para que encuentres más rápido lo que buscás.",
  },
  contactPage: {
    title: "Contacto",
    description:
      "¿Tenés alguna consulta? Escribinos por WhatsApp o encontranos en nuestro local.",
    whatsappLabel: "WhatsApp",
    emailLabel: "Email",
    addressLabel: "Dirección",
    hoursLabel: "Horario de atención",
    whatsappCta: "Contactar por WhatsApp",
    mapCta: "Ver ubicación",
  },
  faqPage: {
    title: "Preguntas frecuentes",
    description: "Las dudas más comunes sobre envíos, pagos y devoluciones.",
  },
  relatedProductsSection: {
    eyebrow: "También te puede gustar",
    title: "Fragancias relacionadas",
  },
  cartPage: {
    title: "Tu carrito",
    emptyState: {
      title: "Tu carrito está vacío",
      description:
        "Todavía no agregaste ningún producto. Explorá el catálogo y encontrá algo que te guste.",
      cta: "Ver catálogo",
    },
    summary: {
      title: "Resumen del pedido",
      shippingLabel: "Envío",
      shippingPlaceholder: "Se calcula en el próximo paso",
      continueButton: "Continuar compra",
      disclaimer: "Los impuestos y el envío se calculan en el siguiente paso.",
    },
  },
  checkoutPage: {
    title: "Checkout",
    customerInformation: {
      title: "Información de contacto",
      firstNameLabel: "Nombre",
      lastNameLabel: "Apellido",
      phoneLabel: "Teléfono",
      emailLabel: "Email (opcional)",
    },
    shippingInformation: {
      title: "Entrega",
      deliveryMethodLabel: "Método de entrega",
      deliveryOption: "Delivery",
      pickupOption: "Retiro en tienda",
      departmentLabel: "Departamento",
      cityLabel: "Ciudad",
      neighborhoodLabel: "Barrio",
      addressLabel: "Dirección",
      referenceLabel: "Referencia",
      locationPickerLabel: "Seleccionar ubicación exacta",
      locationHint: "Arrastrá el marcador para ajustar el punto exacto de tu entrega.",
      locationConfirmedLabel: "Ubicación seleccionada correctamente",
      latitudeShortLabel: "Lat",
      longitudeShortLabel: "Lng",
      departmentPlaceholder: "Elegí un departamento",
      cityPlaceholder: "Elegí una ciudad",
      shippingCostLabel: "Costo de envío",
      shippingEstimatedDaysLabel: "Tiempo estimado",
      shippingCostLoading: "Calculando el costo de envío...",
      shippingCostToConfirm: "A confirmar",
      shippingCostToConfirmHint:
        "El vendedor confirmará el costo del envío una vez recibido el pedido.",
    },
    paymentMethod: {
      title: "Método de pago",
      transferOption: "Transferencia bancaria",
      cashOption: "Efectivo",
    },
    orderNotes: {
      title: "Notas del pedido",
      placeholder: "Llamar antes de llegar.",
    },
    summary: {
      title: "Resumen del pedido",
      itemCountLabel: "Cantidad total",
      subtotalLabel: "Subtotal",
      shippingLabel: "Envío",
      shippingPlaceholder: "Se calcula en el próximo paso",
    },
    continueButton: "Continuar",
  },
  confirmationPage: {
    title: "Confirmá tu pedido",
    breadcrumbLabel: "Confirmación",
    editDataButton: "Editar datos",
    customerInformation: {
      title: "Tus datos",
      nameLabel: "Nombre",
      phoneLabel: "Teléfono",
      emailLabel: "Email",
    },
    backButton: "Volver",
    confirmButton: "Confirmar pedido",
  },
} as const;
