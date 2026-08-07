export const siteConfig = {
  name: "ZURIK Perfumería",
  description: "Encontrá lo que buscás, con envío rápido y atención personalizada.",
  hero: {
    eyebrow: "Bienvenido a la tienda",
    title: "Perfumes de Calidad y Buen Precio",
    subtitle:
      "Comprá con confianza: productos verificados, atención directa y envíos rápidos, todo en una experiencia simple.",
    primaryCta: {
      label: "Explorar productos",
      href: "/productos",
    },
    secondaryCta: {
      label: "Contactar por WhatsApp",
    },
  },
  search: {
    placeholder: "Buscar productos...",
  },
  featuredCategoriesSection: {
    eyebrow: "Categorías",
    title: "Explorá por categoría",
    subtitle:
      "Encontrá justo lo que buscás, organizado para que comprar sea simple.",
  },
  featuredProductsSection: {
    eyebrow: "Destacados",
    title: "Productos destacados",
    subtitle:
      "Una selección pensada para vos, con la calidad y confianza de siempre.",
  },
  featuredBenefitsSection: {
    eyebrow: "Por qué elegirnos",
    title: "¿Por qué comprar con nosotros?",
    subtitle: "Lo que nos hace diferentes, en cada compra que hacés.",
  },
  testimonialsSection: {
    eyebrow: "Testimonios",
    title: "Lo que dicen nuestros clientes",
    subtitle: "Historias reales de compras reales.",
  },
  productsPage: {
    title: "Todos los productos",
    description:
      "Explorá el catálogo completo, pensado con la misma calidad y confianza de siempre.",
    emptyState: {
      title: "No hay productos disponibles",
      description: "Todavía no cargamos productos en esta sección. Volvé a visitarnos pronto.",
    },
    searchEmptyState: {
      title: "No encontramos productos para tu búsqueda",
      description: "Probá con otra palabra o revisá que esté bien escrita.",
    },
  },
  categoriesPage: {
    title: "Categorías",
    description: "Explorá el catálogo organizado por categoría, para encontrar más rápido lo que buscás.",
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
    eyebrow: "También te puede interesar",
    title: "Productos relacionados",
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
