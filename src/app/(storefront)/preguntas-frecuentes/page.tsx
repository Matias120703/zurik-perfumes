import type { Metadata } from "next";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { faqItems } from "@/config/faq";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.faqPage.title} | ${siteConfig.name}`,
  description: siteConfig.faqPage.description,
};

export default function FaqPage() {
  const { title, description } = siteConfig.faqPage;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: title }]} />

      <div className="mt-6 flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <dl className="mt-10 flex flex-col divide-y divide-border">
        {faqItems.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 py-6 first:pt-0">
            <dt className="text-lg font-semibold text-foreground">{item.question}</dt>
            <dd className="text-muted-foreground">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
