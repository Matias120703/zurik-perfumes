import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";
const CONTENT_BUCKET = "product-content";
const CATEGORY_BUCKET = "category-images";

/**
 * Toda comunicación con Supabase Storage vive acá -- ningún componente ni
 * hook llama a supabase.storage directamente (mismo criterio que
 * services/products.ts para la base de datos).
 */
export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const supabase = createClient();
  const path = `${productId}/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * `getPublicUrl()` arma la URL con `encodeURI()` (storage-js) -- un nombre
 * de archivo con espacios u otros caracteres especiales (`file.name` se usa
 * tal cual al subir, sin sanitizar) queda percent-encoded en la URL
 * guardada (`... Foto Final.png` -> `...%20Foto%20Final.png`). Sin
 * `decodeURIComponent()` acá, esta función devolvía la ruta todavía
 * encodeada, y `.remove([path])` buscaba un objeto cuyo nombre tuviera
 * literalmente `%20` en vez de un espacio -- no encontraba nada, fallaba
 * en silencio (0 archivos removidos, sin error de Supabase) para
 * cualquier imagen subida con un nombre de archivo no trivial. Bug real
 * encontrado y corregido en el Sprint 6.3.2 -- ver CLAUDE.md sección 9.
 */
function getStoragePathFromUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

/**
 * Limpieza de Storage tras reemplazar/quitar una imagen de producto --
 * efecto secundario de guardar el formulario, no la acción principal que
 * pidió el admin. Si Supabase devuelve un error real (RLS, red), se
 * propaga: hay algo genuinamente mal y el admin debe enterarse. Pero si la
 * respuesta viene vacía (0 archivos coincidieron -- ya borrado antes,
 * URL con una ruta que no matchea, o cualquier otra causa ambigua), NO se
 * bloquea el guardado del producto por un archivo húerfano en Storage: el
 * costo de un archivo de más en el bucket es mínimo, bloquear a un admin
 * de guardar su producto por eso no lo es. Se deja un `console.warn` para
 * poder diagnosticarlo (pedido explícito del Sprint 6.3.2), sin interrumpir
 * el flujo -- distinto criterio que `deleteProduct()`/`deleteCategory()`
 * (la eliminación completa del registro, que sigue siendo bloqueante: ahí
 * si el admin pide "Eliminar" y no pasa nada, tiene que saberlo).
 */
export async function deleteProductImageFiles(urls: string[]): Promise<void> {
  const paths = urls
    .map(getStoragePathFromUrl)
    .filter((path): path is string => path !== null);

  if (paths.length === 0) return;

  const supabase = createClient();
  const { data, error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    console.warn(
      "[deleteProductImageFiles] Storage no eliminó ningún archivo (ya no existía, o la ruta no coincide). No se bloquea el guardado del producto.",
      paths
    );
  }
}

/**
 * Bucket separado (`product-content`, Sprint 6.3) para las imágenes/GIFs/
 * videos que un admin inserta DENTRO del texto de la descripción
 * enriquecida -- no son parte de la galería (`product_images`), así que
 * no comparten ruta con `uploadProductImage`. `scopeId` es el `productId`
 * real en modo edición, o un UUID generado una sola vez en el cliente
 * (`ProductForm.tsx`) mientras se está creando un producto nuevo que
 * todavía no tiene id -- mismo criterio que cualquier CMS (WordPress,
 * Notion): el archivo se sube al insertarlo en el editor, no recién al
 * guardar el formulario completo, porque eso requeriría sincronizar URLs
 * de blob locales con URLs reales dentro del documento del editor.
 */
export async function uploadDescriptionAsset(scopeId: string, file: File): Promise<string> {
  const supabase = createClient();
  const path = `${scopeId}/description/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from(CONTENT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(CONTENT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Imagen 1:1 por categoría (Sprint 6.6, bucket propio `category-images`) --
 * mismo patrón que `uploadProductImage` (una carpeta por registro, nombre
 * de archivo con UUID para evitar colisiones/caché de CDN), pero un único
 * archivo por categoría en vez de una galería. `categoryId` es el id real
 * en modo edición, o un UUID generado una sola vez en el cliente
 * (`CategoryForm.tsx`) mientras se está creando una categoría nueva que
 * todavía no tiene id -- mismo criterio ya usado por `descriptionScopeId`
 * en `ProductForm.tsx`.
 */
export async function uploadCategoryImage(categoryId: string, file: File): Promise<string> {
  const supabase = createClient();
  const path = `${categoryId}/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from(CATEGORY_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(CATEGORY_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Mismo bug/misma corrección que `getStoragePathFromUrl` -- ver el
 * comentario ahí para el detalle completo. */
function getCategoryImagePathFromUrl(url: string): string | null {
  const marker = `/object/public/${CATEGORY_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

/** Mismo criterio que `deleteProductImageFiles`: limpieza de Storage, no
 * bloqueante -- ver ese comentario para el razonamiento completo. */
export async function deleteCategoryImageFile(url: string): Promise<void> {
  const path = getCategoryImagePathFromUrl(url);
  if (!path) return;

  const supabase = createClient();
  const { data, error } = await supabase.storage.from(CATEGORY_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    console.warn(
      "[deleteCategoryImageFile] Storage no eliminó ningún archivo (ya no existía, o la ruta no coincide). No se bloquea el guardado de la categoría.",
      path
    );
  }
}
