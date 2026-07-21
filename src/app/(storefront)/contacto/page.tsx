import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getGoogleMapsUrl, getWhatsAppUrl } from "@/lib/utils";
import { getPublicBusinessSettings } from "@/services/storefront/business";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicBusinessSettings();
  return {
    title: `${siteConfig.contactPage.title} | ${settings.storeName}`,
    description: siteConfig.contactPage.description,
  };
}

export default async function ContactPage() {
  const {
    title,
    description,
    whatsappLabel,
    emailLabel,
    addressLabel,
    hoursLabel,
    whatsappCta,
    mapCta,
  } = siteConfig.contactPage;

  // Datos que también muestra el Footer, ahora desde business_settings
  // (Sprint 5.5) en vez de footerConfig/businessConfig -- no se duplica
  // información nueva, se resuelve una vez más acá (mismo criterio que
  // ya aplicaba cuando venían de config/).
  const settings = await getPublicBusinessSettings();
  const { contactEmail: email, contactHours: hours, contactAddress: address } = settings;

  const whatsappHref = getWhatsAppUrl(settings.whatsappNumber, settings.whatsappDefaultMessage);
  const mapsHref = getGoogleMapsUrl(address ?? "", { lat: settings.mapDefaultLat, lng: settings.mapDefaultLng });

  const contactItems = [
    { icon: MessageCircle, label: whatsappLabel, value: `+${settings.whatsappNumber}` },
    { icon: Mail, label: emailLabel, value: email },
    { icon: MapPin, label: addressLabel, value: address },
    { icon: Clock, label: hoursLabel, value: hours },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Contacto" }]} />

      <div className="mx-auto mt-6 max-w-2xl">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="mt-10 flex flex-col gap-6 rounded-2xl border border-border bg-card p-8">
          <ul className="flex flex-col gap-4">
            {contactItems.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              size="lg"
              className="w-full sm:flex-1"
              nativeButton={false}
              render={<a href={whatsappHref} target="_blank" rel="noopener noreferrer" />}
            >
              <MessageCircle className="size-4" />
              {whatsappCta}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:flex-1"
              nativeButton={false}
              render={<a href={mapsHref} target="_blank" rel="noopener noreferrer" />}
            >
              <MapPin className="size-4" />
              {mapCta}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
