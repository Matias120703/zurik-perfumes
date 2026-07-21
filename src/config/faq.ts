export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    id: "envios",
    question: "¿Cuánto tarda en llegar mi pedido?",
    answer:
      "En Villarrica y Asunción, entre 24 y 72 horas hábiles. Al resto del país, entre 3 y 7 días hábiles según la localidad.",
  },
  {
    id: "pago",
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos transferencia bancaria y efectivo al momento de la entrega o retiro.",
  },
  {
    id: "retiro",
    question: "¿Puedo retirar mi pedido en el local?",
    answer:
      "Sí, en el checkout podés elegir 'Retiro en tienda' en vez de Delivery.",
  },
  {
    id: "seguimiento",
    question: "¿Cómo hago seguimiento de mi pedido?",
    answer: "Te contactamos por WhatsApp con la información de seguimiento una vez despachado.",
  },
  {
    id: "cambios",
    question: "¿Puedo cambiar o devolver un producto?",
    answer:
      "Sí, escribinos por WhatsApp dentro de los 10 días de recibido el producto para coordinar el cambio o la devolución.",
  },
  {
    id: "contacto",
    question: "¿Cómo me contacto si tengo una duda?",
    answer: "Podés escribirnos por WhatsApp o por email desde nuestra página de Contacto.",
  },
];
