import { createClient } from "@/lib/supabase/client";
import { assertRowAffected } from "@/lib/supabase/assert-write";

/**
 * Toda la comunicación con la tabla `products` (y su detalle
 * `product_images`) vive acá -- ningún componente ni hook arma una query
 * de Supabase por su cuenta. `AdminProduct` es un tipo propio del panel,
 * separado del `Product` de config/products.ts que sigue usando la tienda
 * pública: son dos fuentes de datos distintas hasta que se conecten
 * (roadmap), y no deben compartir contrato todavía.
 */

export type AdminProductImage = {
  id: string;
  url: string;
  displayOrder: number;
  altText: string | null;
};

export type AdminProduct = {
  id: string;
  categoryId: string;
  categoryName: string | null;
  name: string;
  slug: string;
  shortDescription: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  images: AdminProductImage[];
};

export type ProductFormInput = {
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  featured: boolean;
  isActive: boolean;
};

type ProductRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  featured: boolean;
  is_active: boolean;
  created_at: string;
  categories: { id: string; name: string } | null;
  product_images: {
    id: string;
    url: string;
    display_order: number;
    alt_text: string | null;
  }[];
};

const PRODUCT_SELECT = `
  id, category_id, name, slug, short_description, description, price, old_price, stock, featured, is_active, created_at,
  categories ( id, name ),
  product_images ( id, url, display_order, alt_text )
`;

function mapProductRow(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    description: row.description,
    price: Number(row.price),
    oldPrice: row.old_price !== null ? Number(row.old_price) : null,
    stock: row.stock,
    featured: row.featured,
    isActive: row.is_active,
    createdAt: row.created_at,
    images: [...row.product_images]
      .sort((a, b) => a.display_order - b.display_order)
      .map((image) => ({
        id: image.id,
        url: image.url,
        displayOrder: image.display_order,
        altText: image.alt_text,
      })),
  };
}

export async function listProducts(): Promise<AdminProduct[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as ProductRow[]).map(mapProductRow);
}

export async function getProductById(id: string): Promise<AdminProduct | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapProductRow(data as unknown as ProductRow) : null;
}

function toRow(input: ProductFormInput) {
  return {
    category_id: input.categoryId,
    name: input.name,
    slug: input.slug,
    short_description: input.shortDescription,
    description: input.description.trim() ? input.description : null,
    price: input.price,
    old_price: input.oldPrice,
    stock: input.stock,
    featured: input.featured,
    is_active: input.isActive,
  };
}

export async function createProduct(input: ProductFormInput): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(toRow(input))
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateProduct(id: string, input: ProductFormInput): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .update(toRow(input))
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  assertRowAffected(
    data,
    "No se pudo actualizar el producto: no tenés permisos de administrador o el producto ya no existe."
  );
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("products").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  assertRowAffected(
    data,
    "No se pudo eliminar el producto: no tenés permisos de administrador o el producto ya no existe."
  );
}

export async function addProductImages(
  productId: string,
  images: { url: string; displayOrder: number; altText: string | null }[]
): Promise<void> {
  if (images.length === 0) return;

  const supabase = createClient();
  const { error } = await supabase.from("product_images").insert(
    images.map((image) => ({
      product_id: productId,
      url: image.url,
      display_order: image.displayOrder,
      alt_text: image.altText,
    }))
  );

  if (error) throw new Error(error.message);
}

export async function deleteProductImageRows(imageIds: string[]): Promise<void> {
  if (imageIds.length === 0) return;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_images")
    .delete()
    .in("id", imageIds)
    .select("id");
  if (error) throw new Error(error.message);
  assertRowAffected(data, "No se pudieron eliminar las imágenes: no tenés permisos de administrador.");
}
