import type { Variants } from "framer-motion";

/**
 * Variants estándar para las secciones que animan su entrada al hacer
 * scroll (whileInView). El Hero no las usa: anima al montar la página,
 * no al entrar en viewport, y por eso mantiene su propio timing.
 */
export const sectionContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const sectionItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
