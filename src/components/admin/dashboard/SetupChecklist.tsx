"use client";

import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardSetup, DashboardSummary } from "@/services/dashboard";
import { cn } from "@/lib/utils";

type ChecklistStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
};

/**
 * Guía de puesta en marcha. Reemplaza al vacío que quedaba en /admin
 * mientras la tienda todavía no tiene pedidos: en vez de seis tarjetas en
 * cero y dos gráficos sin datos (que se leen como "algo está roto"), se
 * muestra qué falta hacer para empezar a vender.
 *
 * Cada paso se marca como cumplido a partir de datos reales que el
 * Dashboard ya trae -- ninguno se guarda ni se "tilda" a mano, así que no
 * puede quedar desincronizado con el estado verdadero de la tienda.
 *
 * Desaparece sola en cuanto entra el primer pedido: a partir de ahí el
 * espacio lo ocupan las métricas, que es lo que de verdad importa.
 */
export function SetupChecklist({
  summary,
  setup,
}: {
  summary: DashboardSummary;
  setup: DashboardSetup;
}) {
  const { hasProductPhotos, hasHomeContent, hasShippingRates } = setup;

  const steps: ChecklistStep[] = [
    {
      id: "categories",
      label: "Crear tus marcas",
      description: "Rayhaan, Afnan, Rasasi... así el cliente filtra por lo que ya conoce.",
      href: "/admin/categorias",
      done: summary.activeCategories > 0,
    },
    {
      id: "products",
      label: "Cargar tus perfumes",
      description: "Nombre, precio y stock de cada fragancia que vendés.",
      href: "/admin/productos",
      done: summary.activeProducts > 0,
    },
    {
      id: "photos",
      label: "Subir fotos reales",
      description: "Un perfume sin foto se vende mucho menos. Es lo que más mueve la aguja.",
      href: "/admin/productos",
      done: hasProductPhotos,
    },
    {
      id: "content",
      label: "Escribir la portada",
      description: "Anuncios, título principal, bloque mayorista y garantías.",
      href: "/admin/contenido",
      done: hasHomeContent,
    },
    {
      id: "shipping",
      label: "Configurar los envíos",
      description: "Definí cuánto cobrás por ciudad para que el checkout calcule solo.",
      href: "/admin/logistica",
      done: hasShippingRates,
    },
  ];

  const completed = steps.filter((step) => step.done).length;

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">Puesta en marcha</h2>
          <p className="text-sm text-muted-foreground">
            Todavía no entró ningún pedido. Estos son los pasos que más ayudan a que llegue el
            primero.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          {completed} de {steps.length} listos
        </span>
      </div>

      <ol className="flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="group flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/40"
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                  step.done
                    ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-600"
                    : "border-border text-muted-foreground"
                )}
              >
                {step.done ? (
                  <Check className="size-3" aria-hidden="true" />
                ) : (
                  <Circle className="size-2 fill-current" aria-hidden="true" />
                )}
              </span>

              <span className="flex flex-1 flex-col gap-0.5">
                <span
                  className={cn(
                    "text-sm font-medium",
                    step.done ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span className="text-xs text-muted-foreground">{step.description}</span>
              </span>

              <ArrowRight
                className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        <Button size="sm" nativeButton={false} render={<Link href="/admin/productos/nuevo" />}>
          Cargar un perfume
        </Button>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<a href="/" target="_blank" rel="noopener noreferrer" />}
        >
          Ver mi tienda
        </Button>
      </div>
    </section>
  );
}
