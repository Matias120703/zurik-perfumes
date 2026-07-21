import type { Metadata } from "next";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { CategoryCard } from "@/components/storefront/CategoryCard";
import { siteConfig } from "@/config/site";
import { getPublicCategories } from "@/services/storefront/categories";

export const metadata: Metadata = {
  title: `${siteConfig.categoriesPage.title} | ${siteConfig.name}`,
  description: siteConfig.categoriesPage.description,
};

export default async function CategoriesPage() {
  const { title, description } = siteConfig.categoriesPage;
  const categories = await getPublicCategories();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Categorías" }]} />

      <div className="mt-6 flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-md text-muted-foreground">{description}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </main>
  );
}
