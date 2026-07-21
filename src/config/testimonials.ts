export type Testimonial = {
  id: string;
  name: string;
  city: string;
  /** De 1 a 5. */
  rating: number;
  comment: string;
  /** Reservado para la foto real (aún no se usa: se renderiza un avatar con iniciales). */
  avatar: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    name: "Lucía Fernández",
    city: "Villarrica",
    rating: 5,
    comment: "Excelente atención y el pedido llegó muy rápido. Totalmente recomendable.",
    avatar: "/testimonials/lucia-fernandez.jpg",
  },
  {
    id: "testimonial-2",
    name: "Martín Gómez",
    city: "Asunción",
    rating: 5,
    comment: "La calidad de los productos superó mis expectativas. Ya hice mi segunda compra.",
    avatar: "/testimonials/martin-gomez.jpg",
  },
  {
    id: "testimonial-3",
    name: "Sofía Ramírez",
    city: "Ciudad del Este",
    rating: 4,
    comment:
      "Muy buena experiencia de compra. El envío tardó un poco más de lo esperado, pero valió la pena.",
    avatar: "/testimonials/sofia-ramirez.jpg",
  },
  {
    id: "testimonial-4",
    name: "Diego Torres",
    city: "Encarnación",
    rating: 5,
    comment: "Atención personalizada de verdad: me ayudaron a elegir el producto ideal.",
    avatar: "/testimonials/diego-torres.jpg",
  },
  {
    id: "testimonial-5",
    name: "Valentina Ríos",
    city: "Coronel Oviedo",
    rating: 5,
    comment: "Se nota que cuidan cada detalle. Voy a seguir comprando acá.",
    avatar: "/testimonials/valentina-rios.jpg",
  },
  {
    id: "testimonial-6",
    name: "Nicolás Acosta",
    city: "Caaguazú",
    rating: 5,
    comment: "Precios justos y una tienda muy confiable. La recomiendo sin dudarlo.",
    avatar: "/testimonials/nicolas-acosta.jpg",
  },
];
