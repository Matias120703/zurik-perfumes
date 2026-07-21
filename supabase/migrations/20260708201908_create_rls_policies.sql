-- Row Level Security de las 12 tablas de dominio (el bucket de Storage ya
-- tiene sus propias policies en la migración 003).
--
-- Estrategia (docs/database-architecture.md, sección 6):
--   * Lectura pública (rol anon + authenticated, vía "to public"): todo lo
--     que hoy consume el storefront sin login -- categories, products,
--     product_images, banners activos, promotions activas y vigentes,
--     testimonials activos, benefits activos, business_settings.
--   * Sin lectura pública: customers, orders, order_items. Ninguna policy
--     de "anon puede insertar un pedido" todavía -- ese es el día que el
--     checkout escriba en Supabase (roadmap, CLAUDE.md sección 8), fuera de
--     alcance de este sprint ("NO conectar la tienda a Supabase"). Hasta
--     entonces, ambas operaciones quedan restringidas a admins.
--   * Escritura (insert/update/delete) de cualquier tabla de catálogo o
--     contenido: solo si public.is_admin() es true.
--   * admins: cada usuario solo lee/edita su propia fila (auth.uid() = id).
--     Sin policy de insert/delete: alta y baja de administradores se hacen
--     con la service_role key (que ignora RLS), no desde el cliente.

-- ============================================================
-- categories
-- ============================================================
alter table public.categories enable row level security;

create policy "categories_public_read_active"
on public.categories for select
to public
using (is_active = true);

create policy "categories_admin_read_all"
on public.categories for select
to authenticated
using (public.is_admin());

create policy "categories_admin_insert"
on public.categories for insert
to authenticated
with check (public.is_admin());

create policy "categories_admin_update"
on public.categories for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "categories_admin_delete"
on public.categories for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- products (sin is_active en el diseño actual: se lee completo)
-- ============================================================
alter table public.products enable row level security;

create policy "products_public_read"
on public.products for select
to public
using (true);

create policy "products_admin_insert"
on public.products for insert
to authenticated
with check (public.is_admin());

create policy "products_admin_update"
on public.products for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "products_admin_delete"
on public.products for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- product_images
-- ============================================================
alter table public.product_images enable row level security;

create policy "product_images_public_read"
on public.product_images for select
to public
using (true);

create policy "product_images_admin_insert"
on public.product_images for insert
to authenticated
with check (public.is_admin());

create policy "product_images_admin_update"
on public.product_images for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "product_images_admin_delete"
on public.product_images for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- customers (sin lectura ni escritura pública)
-- ============================================================
alter table public.customers enable row level security;

create policy "customers_admin_read"
on public.customers for select
to authenticated
using (public.is_admin());

create policy "customers_admin_insert"
on public.customers for insert
to authenticated
with check (public.is_admin());

create policy "customers_admin_update"
on public.customers for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "customers_admin_delete"
on public.customers for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- orders (sin lectura ni escritura pública)
-- ============================================================
alter table public.orders enable row level security;

create policy "orders_admin_read"
on public.orders for select
to authenticated
using (public.is_admin());

create policy "orders_admin_insert"
on public.orders for insert
to authenticated
with check (public.is_admin());

create policy "orders_admin_update"
on public.orders for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "orders_admin_delete"
on public.orders for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- order_items (sin lectura ni escritura pública)
-- ============================================================
alter table public.order_items enable row level security;

create policy "order_items_admin_read"
on public.order_items for select
to authenticated
using (public.is_admin());

create policy "order_items_admin_insert"
on public.order_items for insert
to authenticated
with check (public.is_admin());

create policy "order_items_admin_update"
on public.order_items for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "order_items_admin_delete"
on public.order_items for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- business_settings (fila única; sin columna sensible que ocultar)
-- ============================================================
alter table public.business_settings enable row level security;

create policy "business_settings_public_read"
on public.business_settings for select
to public
using (true);

create policy "business_settings_admin_update"
on public.business_settings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Sin policy de insert/delete: la fila única la crea el seed (o la
-- service_role key); nadie debe poder duplicarla ni borrarla desde el panel.

-- ============================================================
-- banners
-- ============================================================
alter table public.banners enable row level security;

create policy "banners_public_read_active"
on public.banners for select
to public
using (is_active = true);

create policy "banners_admin_read_all"
on public.banners for select
to authenticated
using (public.is_admin());

create policy "banners_admin_insert"
on public.banners for insert
to authenticated
with check (public.is_admin());

create policy "banners_admin_update"
on public.banners for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "banners_admin_delete"
on public.banners for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- promotions (públicas solo si están activas Y vigentes ahora mismo)
-- ============================================================
alter table public.promotions enable row level security;

create policy "promotions_public_read_active"
on public.promotions for select
to public
using (is_active = true and now() between starts_at and ends_at);

create policy "promotions_admin_read_all"
on public.promotions for select
to authenticated
using (public.is_admin());

create policy "promotions_admin_insert"
on public.promotions for insert
to authenticated
with check (public.is_admin());

create policy "promotions_admin_update"
on public.promotions for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "promotions_admin_delete"
on public.promotions for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- testimonials
-- ============================================================
alter table public.testimonials enable row level security;

create policy "testimonials_public_read_active"
on public.testimonials for select
to public
using (is_active = true);

create policy "testimonials_admin_read_all"
on public.testimonials for select
to authenticated
using (public.is_admin());

create policy "testimonials_admin_insert"
on public.testimonials for insert
to authenticated
with check (public.is_admin());

create policy "testimonials_admin_update"
on public.testimonials for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "testimonials_admin_delete"
on public.testimonials for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- benefits
-- ============================================================
alter table public.benefits enable row level security;

create policy "benefits_public_read_active"
on public.benefits for select
to public
using (is_active = true);

create policy "benefits_admin_read_all"
on public.benefits for select
to authenticated
using (public.is_admin());

create policy "benefits_admin_insert"
on public.benefits for insert
to authenticated
with check (public.is_admin());

create policy "benefits_admin_update"
on public.benefits for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "benefits_admin_delete"
on public.benefits for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- admins (cada uno ve/edita únicamente su propia fila)
-- ============================================================
alter table public.admins enable row level security;

create policy "admins_self_read"
on public.admins for select
to authenticated
using (auth.uid() = id);

create policy "admins_self_update"
on public.admins for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Sin policy de insert/delete: alta y baja de administradores se hacen con
-- la service_role key desde el servidor (sprint del panel/login), nunca
-- desde el cliente autenticado.
