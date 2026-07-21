-- Extiende `business_settings` con las columnas que pide el Sprint 5.5
-- (módulo de Configuración General) y que no estaban en el diseño
-- aprobado de la Fase 8: eslogan, branding (logo/favicon) y redes
-- sociales como campos nombrados, más país/ciudad para la sección
-- Ubicación (lat/lng/zoom ya existían desde la Fase 8).
--
-- Todas nullable: la fila única ya existe (sembrada en la Fase 8) y
-- ninguna de estas columnas tenía valor antes de este sprint -- no hay
-- "default razonable" para un logo o un usuario de TikTok, a diferencia
-- de `is_active`/`icon_name` en sprints anteriores.

alter table public.business_settings
  add column tagline text,
  add column logo_url text,
  add column favicon_url text,
  add column instagram_url text,
  add column facebook_url text,
  add column tiktok_url text,
  add column map_country text,
  add column map_city text;

comment on column public.business_settings.tagline is 'Eslogan corto del negocio, gestionado desde /admin/configuracion (Sprint 5.5).';
comment on column public.business_settings.logo_url is 'URL pública del logo en Supabase Storage (bucket "branding"). Null = se muestra el nombre en texto (mismo criterio placeholder-vs-real que product_images).';
comment on column public.business_settings.favicon_url is 'URL pública del favicon en Supabase Storage (bucket "branding"). Null = se usa el favicon estático de app/favicon.ico.';
comment on column public.business_settings.instagram_url is 'Reemplaza la necesidad de social_links para Instagram -- campo nombrado en vez de JSON genérico, pedido explícitamente por el sprint.';
comment on column public.business_settings.facebook_url is 'Reemplaza la necesidad de social_links para Facebook -- ver instagram_url.';
comment on column public.business_settings.tiktok_url is 'Red social nueva, sin equivalente previo en config/footer.ts ni en social_links.';
comment on column public.business_settings.map_country is 'País de referencia del negocio (sección Ubicación del panel). Descriptivo -- no reemplaza contact_address.';
comment on column public.business_settings.map_city is 'Ciudad de referencia del negocio (sección Ubicación del panel). Descriptivo -- no reemplaza contact_address.';

-- Bucket de Storage dedicado para branding (logo/favicon) -- separado de
-- product-images a propósito: son archivos singleton (uno por negocio,
-- no una galería por fila), sin relación con ningún producto, y con un
-- ciclo de vida propio (nunca se borran en cascada junto con nada). Mismo
-- patrón de policies que product-images (Fase 8): público de lectura,
-- escritura solo admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  2097152, -- 2 MB: logos/favicons no necesitan el límite de 5 MB de fotos de producto
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
on conflict (id) do nothing;

create policy "branding_public_read"
on storage.objects
for select
to public
using (bucket_id = 'branding');

create policy "branding_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'branding' and public.is_admin());

create policy "branding_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'branding' and public.is_admin())
with check (bucket_id = 'branding' and public.is_admin());

create policy "branding_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'branding' and public.is_admin());
