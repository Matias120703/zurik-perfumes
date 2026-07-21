-- Sprint 6.3 -- descripción enriquecida de producto (editor tipo
-- Shopify/WordPress/Notion en /admin/productos). Las imágenes, GIFs y
-- videos que un admin inserta DENTRO del texto de `products.description`
-- se suben a un bucket propio, `product-content`, separado de
-- `product-images` (Fase 8/10) a propósito: `product-images` es la
-- galería estructurada de fotos del producto (display_order, alt_text,
-- fila propia en product_images), con límite de 5 MB y solo imágenes
-- fijas -- distinto ciclo de vida y distintas necesidades técnicas que el
-- contenido libre embebido en un rich text (que además incluye video).
-- Mismo criterio ya usado para separar el bucket "branding" (Fase 14) de
-- "product-images".
--
-- `products.description` no necesita ninguna migración: ya es `text`
-- (Fase 10) y guarda HTML sanitizado como cualquier otro string, sin
-- cambiar de tipo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-content',
  'product-content',
  true,
  31457280, -- 30 MB: suficiente para clips de video cortos, generoso para imágenes/GIFs
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

create policy "product_content_public_read"
on storage.objects
for select
to public
using (bucket_id = 'product-content');

create policy "product_content_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-content' and public.is_admin());

create policy "product_content_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-content' and public.is_admin())
with check (bucket_id = 'product-content' and public.is_admin());

create policy "product_content_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-content' and public.is_admin());
