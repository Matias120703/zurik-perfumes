import { FeaturedBenefits } from "@/components/storefront/FeaturedBenefits";
import { FeaturedCategories } from "@/components/storefront/FeaturedCategories";
import { FeaturedProducts } from "@/components/storefront/FeaturedProducts";
import { Hero } from "@/components/storefront/Hero";
import { PromotionalBanner } from "@/components/storefront/PromotionalBanner";
import { TestimonialsSection } from "@/components/storefront/TestimonialsSection";
import { getPublicBusinessSettings } from "@/services/storefront/business";
import { getPublicCategories } from "@/services/storefront/categories";
import { getPublicHeroProducts, getPublicProducts } from "@/services/storefront/products";
import { getActivePromotions } from "@/services/storefront/promotions";

export default async function Home() {
  const [products, categories, settings, promotions, showcaseProducts] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
    getPublicBusinessSettings(),
    getActivePromotions(),
    getPublicHeroProducts(),
  ]);

  return (
    <>
      <Hero settings={settings} showcaseProducts={showcaseProducts} />
      <FeaturedCategories categories={categories} />
      <FeaturedProducts products={products} categories={categories} promotions={promotions} />
      <PromotionalBanner promotions={promotions} />
      <FeaturedBenefits />
      <TestimonialsSection />
    </>
  );
}
