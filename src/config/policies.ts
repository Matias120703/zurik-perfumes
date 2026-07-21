export type PolicySection = {
  heading: string;
  body: string[];
};

export type Policy = {
  slug: string;
  title: string;
  description: string;
  content: PolicySection[];
};

export const policies: Policy[] = [
  {
    slug: "envios",
    title: "Políticas de envío",
    description: "Cómo, cuándo y a dónde llegan tus pedidos.",
    content: [
      {
        heading: "Zonas de envío",
        body: [
          "Realizamos envíos a Villarrica, Asunción y al resto del país a través de correo.",
        ],
      },
      {
        heading: "Tiempos de entrega",
        body: [
          "Villarrica y Asunción: entre 24 y 72 horas hábiles desde la confirmación del pedido.",
          "Resto del país: entre 3 y 7 días hábiles, según la localidad.",
        ],
      },
      {
        heading: "Costos de envío",
        body: [
          "El costo se calcula según tu dirección y se muestra en el checkout antes de confirmar el pedido.",
        ],
      },
      {
        heading: "Seguimiento",
        body: [
          "Una vez despachado tu pedido, te contactamos por WhatsApp con la información de seguimiento.",
        ],
      },
    ],
  },
  {
    slug: "privacidad",
    title: "Política de privacidad",
    description: "Qué información recopilamos y cómo la protegemos.",
    content: [
      {
        heading: "Qué información recopilamos",
        body: [
          "Solo pedimos los datos necesarios para procesar tu pedido: nombre, teléfono, email opcional y dirección de entrega.",
        ],
      },
      {
        heading: "Cómo la usamos",
        body: [
          "Usamos tus datos exclusivamente para gestionar tu pedido y comunicarnos con vos. No compartimos tu información con terceros.",
        ],
      },
      {
        heading: "Seguridad",
        body: [
          "No almacenamos datos de tarjetas ni medios de pago: los pedidos se coordinan por transferencia bancaria o efectivo.",
        ],
      },
      {
        heading: "Tus derechos",
        body: [
          "Podés solicitar la eliminación de tus datos en cualquier momento escribiéndonos por WhatsApp.",
        ],
      },
    ],
  },
  {
    slug: "terminos",
    title: "Términos y condiciones",
    description: "Las condiciones de uso de la tienda.",
    content: [
      {
        heading: "Aceptación de los términos",
        body: [
          "Al utilizar este sitio y realizar una compra, aceptás las condiciones descritas en esta página.",
        ],
      },
      {
        heading: "Productos y precios",
        body: [
          "Los precios están expresados en guaraníes (PYG) y pueden modificarse sin previo aviso. Todas las compras están sujetas a disponibilidad de stock.",
        ],
      },
      {
        heading: "Métodos de pago y entrega",
        body: [
          "Aceptamos transferencia bancaria y efectivo. Podés elegir recibir tu pedido por delivery o retirarlo en el local.",
        ],
      },
      {
        heading: "Modificaciones",
        body: [
          "Podemos actualizar estos términos en cualquier momento. Te recomendamos revisarlos periódicamente.",
        ],
      },
    ],
  },
];

export function getPolicyBySlug(slug: string): Policy | undefined {
  return policies.find((policy) => policy.slug === slug);
}
