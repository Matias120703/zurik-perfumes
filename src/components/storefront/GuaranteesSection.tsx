"use client";

import { motion, useReducedMotion } from "framer-motion";

import { SectionHeading } from "@/components/storefront/SectionHeading";
import { getGuaranteeIcon } from "@/components/storefront/guarantee-icons";
import type { HomeGuarantee } from "@/lib/home-content";
import { sectionContainerVariants as container, sectionItemVariants as item } from "@/lib/motion";

/**
 * Reemplaza a la sección de testimonios del template original, que traía
 * reseñas de clientes inventados ("Lucía Fernández, Villarrica") heredadas
 * de otro cliente del engine. Mostrar reseñas falsas en una tienda real es
 * engañoso para quien compra, así que en su lugar se muestran garantías
 * verificables del negocio, cargadas desde /admin/contenido.
 *
 * Si no hay ninguna garantía cargada, la sección no se renderiza.
 */
export function GuaranteesSection({
  guarantees,
  eyebrow,
  title,
  subtitle,
  enabled,
}: {
  guarantees: HomeGuarantee[];
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  enabled: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (!enabled || guarantees.length === 0) return null;

  return (
    <section className="border-t border-border/60 bg-[color-mix(in_oklab,var(--gold)_4%,var(--background))]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <SectionHeading
          eyebrow={eyebrow}
          title={title ?? "Por qué elegirnos"}
          subtitle={subtitle}
          align="center"
        />

        <motion.div
          initial={shouldReduceMotion ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {guarantees.map((guarantee) => {
            const Icon = getGuaranteeIcon(guarantee.icon);
            return (
              <motion.div
                key={guarantee.title}
                variants={item}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/60 p-6 text-center transition-colors duration-300 hover:border-[var(--gold)]/35 sm:items-start sm:text-left"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl border border-[var(--gold)]/25 bg-[var(--gold)]/10 text-[var(--gold)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold text-foreground">{guarantee.title}</h3>
                  {guarantee.description ? (
                    <p className="text-sm text-muted-foreground">{guarantee.description}</p>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
