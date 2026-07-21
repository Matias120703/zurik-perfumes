-- Índices explícitos (por fuera de los que Postgres ya crea para cada
-- primary key). Cada uno corresponde 1:1 a un índice listado en
-- docs/database-architecture.md, sección 4 de cada tabla.

-- categories: slug único (URLs), orden de listado, filtro de activas.
create unique index categories_slug_key on public.categories (slug);
create index categories_display_order_idx on public.categories (display_order);
create index categories_active_idx on public.categories (is_active) where is_active = true;

-- products: slug único (/productos/[slug]), filtro de catálogo por
-- categoría, Home (destacados / en oferta).
create unique index products_slug_key on public.products (slug);
create index products_category_id_idx on public.products (category_id);
create index products_featured_idx on public.products (featured) where featured = true;
create index products_on_sale_idx on public.products (on_sale) where on_sale = true;

-- product_images: "las fotos de este producto, en orden" -- consulta única
-- que hace la galería.
create index product_images_product_order_idx on public.product_images (product_id, display_order);

-- customers: upsert por teléfono al confirmar un pedido.
create unique index customers_phone_key on public.customers (phone);

-- orders: número corto único, pedidos de un cliente, panel filtrando por
-- estado, orden cronológico (el más común en cualquier listado).
create unique index orders_order_number_key on public.orders (order_number);
create index orders_customer_id_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

-- order_items: todas las líneas de un pedido; a futuro, "cuántas veces se
-- vendió este producto".
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- banners: solo los activos se muestran en la Home.
create index banners_active_idx on public.banners (is_active) where is_active = true;

-- promotions: por categoría/producto objetivo, y "promociones vigentes
-- ahora mismo" (starts_at/ends_at).
create index promotions_category_id_idx on public.promotions (category_id);
create index promotions_product_id_idx on public.promotions (product_id);
create index promotions_period_idx on public.promotions (starts_at, ends_at);

-- testimonials: solo los activos se muestran en la Home.
create index testimonials_active_idx on public.testimonials (is_active) where is_active = true;

-- business_settings, benefits, admins: sin índices especiales -- se leen
-- siempre completas/pequeñas (ver docs/database-architecture.md).
