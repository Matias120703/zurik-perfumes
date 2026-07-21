-- Sprint 6.6 -- imagen personalizada por categoría, mostrada en las
-- tarjetas de categoría de la tienda pública (Home, /categorias).
--
-- `categories.image_url` NO es una columna nueva: ya existía desde el
-- diseño original de la Fase 8 (`docs/database-architecture.md`), nullable,
-- sin ningún consumidor que la escribiera todavía -- `services/storefront/
-- categories.ts` ya la leía y la mapeaba a `Category.image` desde la
-- Fase 11, pero el panel nunca ofreció una forma de subirla y el
-- storefront nunca la renderizaba (siempre el placeholder). Este sprint
-- conecta ambos extremos, sin ninguna migración de esquema para la
-- columna en sí -- solo el bucket de Storage que le faltaba.
--
-- Bucket propio, separado de `product-images`/`product-content`/`branding`
-- (mismo criterio ya documentado para esos tres, CLAUDE.md sección 11: "un
-- solo bucket por tipo de archivo, nunca reutilizado entre dominios
-- distintos"): las fotos de categoría son un dominio propio, con su propio
-- ciclo de vida (1:1 con la categoría, no una galería como product_images).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'category-images',
  'category-images',
  true,
  5242880, -- 5 MB por archivo, mismo límite que product-images
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "category_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'category-images');

create policy "category_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'category-images' and public.is_admin());

create policy "category_images_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'category-images' and public.is_admin())
with check (bucket_id = 'category-images' and public.is_admin());

create policy "category_images_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'category-images' and public.is_admin());
