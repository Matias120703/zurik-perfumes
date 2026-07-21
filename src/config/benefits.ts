import { BadgeCheck, Headphones, ShieldCheck, Truck, type LucideIcon } from "lucide-react";

export type Benefit = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const benefits: Benefit[] = [
  {
    id: "compra-segura",
    title: "Compra segura",
    description: "Tus datos y tus pagos siempre protegidos, en cada compra.",
    icon: ShieldCheck,
  },
  {
    id: "atencion-personalizada",
    title: "Atención personalizada",
    description: "Te acompañamos antes, durante y después de tu compra.",
    icon: Headphones,
  },
  {
    id: "envios-a-todo-el-pais",
    title: "Envíos a todo el país",
    description: "Recibí tu pedido estés donde estés, sin complicaciones.",
    icon: Truck,
  },
  {
    id: "productos-seleccionados",
    title: "Productos seleccionados",
    description: "Elegimos cada producto pensando en calidad y confianza.",
    icon: BadgeCheck,
  },
];
