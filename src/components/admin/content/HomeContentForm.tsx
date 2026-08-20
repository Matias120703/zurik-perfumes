"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Megaphone, ShieldCheck, Store, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { GuaranteesField } from "@/components/admin/content/GuaranteesField";
import { StringListField } from "@/components/admin/content/StringListField";
import { useHomeContent } from "@/hooks/useHomeContent";
import type { HomeContent } from "@/lib/home-content";

/**
 * Formulario único del contenido de la Home. Mismo patrón que
 * `SettingsForm.tsx`: pestañas para organizar visualmente, pero un solo
 * `<form>` y un solo submit -- `home_content` es una fila única, así que
 * fragmentar el guardado en cinco llamadas no aportaría nada y sí podría
 * dejar la Home a medio actualizar.
 */
function ContentSection({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon?: typeof Store;
  /** Control opcional a la derecha del título (el switch de encendido). */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
              <Icon className="size-4 text-foreground" aria-hidden="true" />
            </span>
          ) : null}
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Switch etiquetado, reutilizado por las 4 secciones que se encienden. */
function EnabledSwitch({
  id,
  checked,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
      {checked ? "Visible" : "Oculta"}
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

export function HomeContentForm() {
  const router = useRouter();
  const { content, isLoading, error, save } = useHomeContent();

  const [form, setForm] = useState<HomeContent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (content) setForm(content);
  }, [content]);

  function update<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setSuccessMessage(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;

    setIsSaving(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      /**
       * Se limpian las líneas vacías antes de guardar: un input en blanco
       * que el admin agregó y no completó no debe llegar a la tienda como
       * un mensaje vacío rotando en la barra de anuncios.
       */
      await save({
        ...form,
        announcementMessages: form.announcementMessages
          .map((message) => message.trim())
          .filter(Boolean),
        wholesaleBenefits: form.wholesaleBenefits.map((benefit) => benefit.trim()).filter(Boolean),
        guarantees: form.guarantees
          .map((guarantee) => ({
            ...guarantee,
            title: guarantee.title.trim(),
            description: guarantee.description.trim(),
          }))
          .filter((guarantee) => guarantee.title !== ""),
      });

      setSuccessMessage("Contenido guardado. Ya está visible en la tienda.");
      /** La Home es un Server Component: sin este refresh, el panel
       * mostraría lo nuevo pero la tienda seguiría sirviendo el render
       * anterior hasta la próxima navegación completa. */
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "No se pudo guardar el contenido."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (isLoading || !form) {
    return <p className="text-sm text-muted-foreground">Cargando contenido...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Tabs defaultValue="portada">
        <TabsList className="flex-wrap">
          <TabsTrigger value="portada">Portada</TabsTrigger>
          <TabsTrigger value="ofertas">Ofertas</TabsTrigger>
          <TabsTrigger value="mayoristas">Mayoristas</TabsTrigger>
          <TabsTrigger value="garantias">Garantías</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------- Portada */}
        <TabsContent value="portada" className="mt-6 flex flex-col gap-6">
          <ContentSection
            icon={Megaphone}
            title="Barra de anuncios"
            description="La franja que aparece arriba de todo, antes del menú. Rota entre los mensajes cada 4 segundos. Es lo primero que lee quien entra."
            action={
              <EnabledSwitch
                id="announcementEnabled"
                checked={form.announcementEnabled}
                onCheckedChange={(checked) => update("announcementEnabled", checked)}
              />
            }
          >
            <StringListField
              items={form.announcementMessages}
              onChange={(next) => update("announcementMessages", next)}
              placeholder="Envíos a todo Paraguay"
              addLabel="Agregar mensaje"
            />
          </ContentSection>

          <ContentSection
            title="Portada principal (Hero)"
            description="El bloque grande de arriba, con el título y los botones. El distintivo de ofertas sólo aparece si hoy hay al menos un producto con precio rebajado."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Distintivo de ofertas" htmlFor="heroBadge">
                <Input
                  id="heroBadge"
                  value={form.heroBadge ?? ""}
                  placeholder="Ofertas activas esta semana"
                  onChange={(event) => update("heroBadge", event.target.value || null)}
                />
              </FormField>

              <FormField label="Antetítulo" htmlFor="heroEyebrow">
                <Input
                  id="heroEyebrow"
                  value={form.heroEyebrow ?? ""}
                  placeholder="Perfumería árabe & de nicho"
                  onChange={(event) => update("heroEyebrow", event.target.value || null)}
                />
              </FormField>
            </div>

            <FormField label="Título principal" htmlFor="heroTitle">
              <Input
                id="heroTitle"
                value={form.heroTitle ?? ""}
                placeholder="Fragancias que *se recuerdan*"
                onChange={(event) => update("heroTitle", event.target.value || null)}
              />
              <p className="text-xs text-muted-foreground">
                Lo que pongas entre asteriscos se muestra en dorado. Ejemplo:{" "}
                <span className="font-medium text-foreground">
                  Fragancias que *se recuerdan*
                </span>{" "}
                → la segunda parte sale dorada. Los asteriscos no se ven.
              </p>
            </FormField>

            <FormField label="Descripción" htmlFor="heroSubtitle">
              <Textarea
                id="heroSubtitle"
                rows={3}
                value={form.heroSubtitle ?? ""}
                placeholder="Perfumes originales de larga duración..."
                onChange={(event) => update("heroSubtitle", event.target.value || null)}
              />
            </FormField>
          </ContentSection>
        </TabsContent>

        {/* ---------------------------------------------- Ofertas */}
        <TabsContent value="ofertas" className="mt-6 flex flex-col gap-6">
          <ContentSection
            icon={Tag}
            title="Sección de ofertas"
            description="Muestra automáticamente los productos que tengan un “Precio anterior” mayor al precio actual, o una promoción vigente. No hace falta elegirlos a mano."
            action={
              <EnabledSwitch
                id="offersEnabled"
                checked={form.offersEnabled}
                onCheckedChange={(checked) => update("offersEnabled", checked)}
              />
            }
          >
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Para que un perfume aparezca acá, editalo en{" "}
              <span className="font-medium text-foreground">Productos</span> y completá el campo{" "}
              <span className="font-medium text-foreground">Precio anterior</span> con un valor
              mayor al precio de venta. El porcentaje de descuento se calcula solo.
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Antetítulo" htmlFor="offersEyebrow">
                <Input
                  id="offersEyebrow"
                  value={form.offersEyebrow ?? ""}
                  placeholder="Ofertas"
                  onChange={(event) => update("offersEyebrow", event.target.value || null)}
                />
              </FormField>

              <FormField label="Título" htmlFor="offersTitle">
                <Input
                  id="offersTitle"
                  value={form.offersTitle ?? ""}
                  placeholder="Ofertas de la semana"
                  onChange={(event) => update("offersTitle", event.target.value || null)}
                />
              </FormField>
            </div>

            <FormField label="Descripción" htmlFor="offersSubtitle">
              <Textarea
                id="offersSubtitle"
                rows={2}
                value={form.offersSubtitle ?? ""}
                placeholder="Precios especiales por tiempo limitado."
                onChange={(event) => update("offersSubtitle", event.target.value || null)}
              />
            </FormField>
          </ContentSection>
        </TabsContent>

        {/* ---------------------------------------------- Mayoristas */}
        <TabsContent value="mayoristas" className="mt-6 flex flex-col gap-6">
          <ContentSection
            icon={Store}
            title="Grupo mayorista"
            description="El bloque que invita a revender. Aparece en la Home y como botón “Mayoristas” en el menú superior."
            action={
              <EnabledSwitch
                id="wholesaleEnabled"
                checked={form.wholesaleEnabled}
                onCheckedChange={(checked) => update("wholesaleEnabled", checked)}
              />
            }
          >
            <FormField label="Link del grupo de WhatsApp" htmlFor="wholesaleGroupUrl">
              <Input
                id="wholesaleGroupUrl"
                value={form.wholesaleGroupUrl ?? ""}
                placeholder="https://chat.whatsapp.com/..."
                onChange={(event) => update("wholesaleGroupUrl", event.target.value || null)}
              />
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {form.wholesaleGroupUrl?.trim()
                  ? "El botón abre este grupo. Si lo borrás, vuelve a abrir un chat directo con tu WhatsApp."
                  : "Vacío: el botón abre un chat directo a tu WhatsApp con el mensaje de abajo. Pegá acá el link del grupo cuando lo tengas."}
              </p>
            </FormField>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Antetítulo" htmlFor="wholesaleEyebrow">
                <Input
                  id="wholesaleEyebrow"
                  value={form.wholesaleEyebrow ?? ""}
                  placeholder="Mayoristas"
                  onChange={(event) => update("wholesaleEyebrow", event.target.value || null)}
                />
              </FormField>

              <FormField label="Texto del botón" htmlFor="wholesaleCtaLabel">
                <Input
                  id="wholesaleCtaLabel"
                  value={form.wholesaleCtaLabel ?? ""}
                  placeholder="Sumarme al grupo mayorista"
                  onChange={(event) => update("wholesaleCtaLabel", event.target.value || null)}
                />
              </FormField>
            </div>

            <FormField label="Título" htmlFor="wholesaleTitle">
              <Input
                id="wholesaleTitle"
                value={form.wholesaleTitle ?? ""}
                placeholder="Vendé perfumes con ZURIK"
                onChange={(event) => update("wholesaleTitle", event.target.value || null)}
              />
            </FormField>

            <FormField label="Descripción" htmlFor="wholesaleSubtitle">
              <Textarea
                id="wholesaleSubtitle"
                rows={3}
                value={form.wholesaleSubtitle ?? ""}
                placeholder="Sumate al grupo mayorista y accedé a precios especiales por cantidad..."
                onChange={(event) => update("wholesaleSubtitle", event.target.value || null)}
              />
            </FormField>

            <FormField
              label="Mensaje de WhatsApp (cuando no hay link de grupo)"
              htmlFor="wholesaleWhatsappMessage"
            >
              <Textarea
                id="wholesaleWhatsappMessage"
                rows={2}
                value={form.wholesaleWhatsappMessage ?? ""}
                placeholder="Hola! Quiero sumarme al grupo mayorista de ZURIK."
                onChange={(event) =>
                  update("wholesaleWhatsappMessage", event.target.value || null)
                }
              />
            </FormField>

            <FormField label="Beneficios de ser mayorista" htmlFor="wholesaleBenefits">
              <StringListField
                items={form.wholesaleBenefits}
                onChange={(next) => update("wholesaleBenefits", next)}
                placeholder="Precios mayoristas por cantidad"
                addLabel="Agregar beneficio"
                maxItems={6}
              />
            </FormField>
          </ContentSection>
        </TabsContent>

        {/* ---------------------------------------------- Garantías */}
        <TabsContent value="garantias" className="mt-6 flex flex-col gap-6">
          <ContentSection
            icon={ShieldCheck}
            title="Garantías"
            description="Los motivos por los que conviene comprarte a vos. Las primeras tres también aparecen como distintivos debajo de los botones de la portada."
            action={
              <EnabledSwitch
                id="guaranteesEnabled"
                checked={form.guaranteesEnabled}
                onCheckedChange={(checked) => update("guaranteesEnabled", checked)}
              />
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Antetítulo" htmlFor="guaranteesEyebrow">
                <Input
                  id="guaranteesEyebrow"
                  value={form.guaranteesEyebrow ?? ""}
                  placeholder="Comprá tranquilo"
                  onChange={(event) => update("guaranteesEyebrow", event.target.value || null)}
                />
              </FormField>

              <FormField label="Título" htmlFor="guaranteesTitle">
                <Input
                  id="guaranteesTitle"
                  value={form.guaranteesTitle ?? ""}
                  placeholder="Por qué elegir ZURIK"
                  onChange={(event) => update("guaranteesTitle", event.target.value || null)}
                />
              </FormField>
            </div>

            <FormField label="Descripción" htmlFor="guaranteesSubtitle">
              <Input
                id="guaranteesSubtitle"
                value={form.guaranteesSubtitle ?? ""}
                placeholder="Lo que te garantizamos en cada pedido."
                onChange={(event) => update("guaranteesSubtitle", event.target.value || null)}
              />
            </FormField>

            <GuaranteesField
              items={form.guarantees}
              onChange={(next) => update("guarantees", next)}
            />
          </ContentSection>
        </TabsContent>
      </Tabs>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<a href="/" target="_blank" rel="noopener noreferrer" />}
        >
          Ver la tienda
          <ExternalLink className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
