-- Storage para imágenes de productos. Solo infraestructura -- la subida en
-- sí (formulario, componente) es un sprint futuro del panel administrativo.
--
-- Un único bucket, público de lectura: hoy config/products.ts ya expone
-- rutas de imagen como texto plano (`/products/iphone-14-1.jpg`), que el
-- storefront siempre pudo mostrar sin login. Reemplazar esas rutas por URLs
-- de Storage no debe requerir volverlas privadas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB por archivo
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- Lectura pública del bucket completo (equivalente a como hoy cualquiera
-- puede ver /products/*.jpg sin autenticarse).
create policy "product_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

-- Escritura (subir/reemplazar/borrar fotos) solo para administradores
-- autenticados -- mismo criterio que el resto del catálogo (sección RLS).
create policy "product_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());
