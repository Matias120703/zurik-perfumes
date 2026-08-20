import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Encabezado compartido de las secciones de la Home (Ofertas, Marcas,
 * Destacados, Garantías) y del catálogo.
 *
 * Se extrajo porque el mismo bloque -- eyebrow en versalitas + filete
 * dorado + título serif + subtítulo -- se repetía en cinco lugares:
 * cruzó de sobra el umbral de "3 o más" que este proyecto usa para
 * decidir cuándo abstraer (CLAUDE.md, sección 6, principio 6). Antes de
 * este sprint cada sección lo escribía a mano, y por eso se habían ido
 * desalineando entre sí.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
  className,
}: {
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  align?: "left" | "center";
  /** Link opcional a la derecha del título (ej. "Ver todo"). */
  action?: { label: string; href: string };
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
        centered && "sm:flex-col sm:items-center",
        className
      )}
    >
      <div className={cn("flex flex-col gap-3", centered && "items-center text-center")}>
        {eyebrow ? (
          <span
            className={cn(
              "flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-[var(--gold)] uppercase",
              centered && "justify-center"
            )}
          >
            <span className="rule-gold h-px w-8" aria-hidden="true" />
            {eyebrow}
            {centered ? <span className="rule-gold h-px w-8" aria-hidden="true" /> : null}
          </span>
        ) : null}

        <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>

        {subtitle ? (
          <p className={cn("max-w-xl text-sm text-muted-foreground sm:text-base")}>
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-2 border-b border-[var(--gold)]/40 pb-1 text-sm font-medium text-[var(--gold)] transition-colors hover:border-[var(--gold)]"
        >
          {action.label}
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      ) : null}
    </div>
  );
}
