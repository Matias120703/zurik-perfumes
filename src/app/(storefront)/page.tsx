import { FeaturedCategories } from "@/components/storefront/FeaturedCategories";
import { FeaturedProducts } from "@/components/storefront/FeaturedProducts";
import { GuaranteesSection } from "@/components/storefront/GuaranteesSection";
import { Hero } from "@/components/storefront/Hero";
import { OffersSection } from "@/components/storefront/OffersSection";
import { PromotionalBanner } from "@/components/storefront/PromotionalBanner";
import { WholesaleSection } from "@/components/storefront/WholesaleSection";
import { getDiscountedProducts } from "@/lib/offers";
import { getPublicBusinessSettings } from "@/services/storefront/business";
import { getPublicCategories } from "@/services/storefront/categories";
import { getPublicHomeContent } from "@/services/storefront/home-content";
import { getPublicHeroProducts, getPublicProducts } from "@/services/storefront/products";
import { getActivePromotions } from "@/services/storefront/promotions";

/**
 * Orden de la Home, pensado para vender y no sólo para mostrar:
 *
 *   1. Hero          -- qué es ZURIK + los 3 caminos posibles (catálogo,
 *                       ofertas, WhatsApp) sin scrollear.
 *   2. Ofertas       -- lo que más convierte, apenas termina el hero.
 *   3. Marcas        -- Rayhaan / Afnan / Rasasi: en perfumería la marca
 *                       es el primer filtro mental de quien compra.
 *   4. Destacados    -- la selección curada de la tienda.
 *   5. Promoción     -- la campaña vigente, si hay alguna cargada.
 *   6. Mayorista     -- el segundo negocio: sumar revendedores.
 *   7. Garantías     -- cierra despejando las objeciones que quedan.
 *
 * Todo el texto de estas secciones sale de `home_content` (editable en
 * /admin/contenido); los productos, de Supabase. Ninguna sección tiene
 * copy de venta hardcodeada en el JSX.
 */
export default async function Home() {
  const [products, categories, settings, promotions, showcaseProducts, homeContent] =
    await Promise.all([
      getPublicProducts(),
      getPublicCategories(),
      getPublicBusinessSettings(),
      getActivePromotions(),
      getPublicHeroProducts(),
      getPublicHomeContent(),
    ]);

  /**
   * Se calcula una sola vez acá y se baja al Hero: así el badge "Ofertas
   * activas" y el botón "Ver ofertas" del hero no pueden aparecer si en
   * realidad no hay ningún producto con descuento. Misma función que
   * alimenta la sección de Ofertas -- una única definición de "oferta".
   */
  const hasOffers = getDiscountedProducts(products, promotions).length > 0;

  return (
    <>
      <Hero
        settings={settings}
        showcaseProducts={showcaseProducts}
        content={homeContent}
        hasOffers={hasOffers}
      />

      {homeContent.offersEnabled ? (
        <OffersSection
          products={products}
          categories={categories}
          promotions={promotions}
          eyebrow={homeContent.offersEyebrow}
          title={homeContent.offersTitle}
          subtitle={homeContent.offersSubtitle}
        />
      ) : null}

      <FeaturedCategories categories={categories} />

      <FeaturedProducts products={products} categories={categories} promotions={promotions} />

      <PromotionalBanner promotions={promotions} />

      <WholesaleSection content={homeContent} settings={settings} />

      <GuaranteesSection
        enabled={homeContent.guaranteesEnabled}
        guarantees={homeContent.guarantees}
        eyebrow={homeContent.guaranteesEyebrow}
        title={homeContent.guaranteesTitle}
        subtitle={homeContent.guaranteesSubtitle}
      />
    </>
  );
}
