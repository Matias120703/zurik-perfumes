import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { getPolicyBySlug, policies } from "@/config/policies";
import { siteConfig } from "@/config/site";

type PolicyPageParams = { slug: string };

export function generateStaticParams() {
  return policies.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PolicyPageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug);

  if (!policy) {
    return { title: `Página no encontrada | ${siteConfig.name}` };
  }

  return {
    title: `${policy.title} | ${siteConfig.name}`,
    description: policy.description,
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<PolicyPageParams>;
}) {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug);

  if (!policy) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: policy.title }]} />

      <div className="mt-6 flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {policy.title}
        </h1>
        <p className="text-muted-foreground">{policy.description}</p>
      </div>

      <div className="mt-10 flex flex-col gap-8">
        {policy.content.map((section) => (
          <div key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
