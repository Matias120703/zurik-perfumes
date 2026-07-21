-- Esquema inicial de Somapp Commerce Engine.
-- Traduce 1:1 el diseño aprobado en docs/database-architecture.md a SQL.
-- Orden de creación: sin dependencias primero, con FK después.
--
-- Nota sobre timestamps: el documento aprobado no lista created_at/updated_at
-- en `product_images` ni en `benefits` (ninguno de los dos), ni `updated_at`
-- en `admins`. Se agregan acá en los tres casos porque este mismo sprint pide
-- explícitamente "cada tabla debe incluir: UUID, timestamps..." y son
-- columnas de auditoría, no una columna de negocio inventada. `order_items`
-- es la única excepción deliberada: es un snapshot inmutable de una línea de
-- pedido (nunca se actualiza), así que no lleva updated_at ni created_at
-- propio (usa el created_at de `orders`).

-- ============================================================
-- Función compartida para mantener "updated_at" en cada UPDATE
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- categories
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null,
  image_url text,
  accent_color text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.categories is 'Categorías del catálogo (config/categories.ts).';

create trigger set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ============================================================
-- products
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null,
  short_description text not null,
  price numeric(12, 2) not null,
  old_price numeric(12, 2),
  stock integer not null default 0,
  featured boolean not null default false,
  on_sale boolean not null default false,
  badge text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_check check (price >= 0),
  constraint products_stock_check check (stock >= 0),
  constraint products_old_price_check check (old_price is null or old_price > price)
);

comment on table public.products is 'Catálogo de productos (config/products.ts).';

create trigger set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============================================================
-- product_images
-- ============================================================
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  display_order integer not null default 0,
  alt_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.product_images is 'Galería de fotos de cada producto (Product.images en config/products.ts). Tabla propia -- no un array -- para poder borrar/reordenar una sola foto desde el panel.';

create trigger set_updated_at
  before update on public.product_images
  for each row execute function public.set_updated_at();

-- ============================================================
-- customers
-- ============================================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customers is 'Identidad de quien compra, identificada por teléfono (CheckoutFormValues). Sin login: se referencia por upsert de phone al crear un pedido.';

create trigger set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ============================================================
-- orders
-- ============================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  customer_id uuid not null references public.customers (id) on delete restrict,
  status text not null default 'pending',
  delivery_method text not null,
  payment_method text not null,
  department text,
  city text,
  neighborhood text,
  address text,
  reference text,
  latitude numeric,
  longitude numeric,
  notes text,
  subtotal numeric(12, 2) not null,
  shipping_cost numeric(12, 2),
  total numeric(12, 2) not null,
  whatsapp_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (
    status in ('pending', 'confirmed', 'preparing', 'ready_or_shipped', 'delivered', 'cancelled')
  ),
  constraint orders_delivery_method_check check (delivery_method in ('delivery', 'pickup')),
  constraint orders_payment_method_check check (payment_method in ('transfer', 'cash')),
  constraint orders_subtotal_check check (subtotal >= 0),
  constraint orders_total_check check (total >= 0),
  -- Igual a la validación HTML5 de hoy en ShippingInformation: con Delivery,
  -- departamento/ciudad/dirección son obligatorios.
  constraint orders_delivery_address_check check (
    delivery_method <> 'delivery'
    or (department is not null and city is not null and address is not null)
  )
);

comment on table public.orders is 'El pedido (OrderConfirmationDetails + lib/whatsapp.ts). order_number es el identificador corto para humanos ("Pedido #48").';

create trigger set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- order_items (snapshot inmutable -- sin updated_at)
-- ============================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null,
  subtotal numeric(12, 2) not null,
  constraint order_items_unit_price_check check (unit_price >= 0),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_subtotal_check check (subtotal >= 0)
);

comment on table public.order_items is 'Detalle línea por línea de un pedido (CartLineItem al confirmar). product_name/unit_price son snapshots: un pedido ya confirmado no debe cambiar si el producto cambia de precio o nombre despues.';

-- ============================================================
-- business_settings (fila única)
-- ============================================================
create table public.business_settings (
  id integer primary key default 1,
  store_name text not null,
  store_description text,
  whatsapp_number text not null,
  whatsapp_default_message text not null,
  whatsapp_product_inquiry_template text not null,
  currency text not null,
  locale text not null,
  map_default_lat numeric not null,
  map_default_lng numeric not null,
  map_default_zoom integer not null,
  contact_email text,
  contact_hours text,
  contact_address text,
  social_links jsonb not null default '[]'::jsonb,
  footer_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_settings_singleton check (id = 1)
);

comment on table public.business_settings is 'Configuración del negocio (config/business.ts + config/site.ts + config/footer.ts). Fila única -- un negocio, una base (Filosofía, CLAUDE.md sección 2).';

create trigger set_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- banners
-- ============================================================
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  button_text text,
  button_url text,
  background_variant text not null,
  badge text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banners_background_variant_check check (background_variant in ('dark', 'light'))
);

comment on table public.banners is 'Banner promocional de la Home (config/promotion.ts / PromotionalBanner).';

create trigger set_updated_at
  before update on public.banners
  for each row execute function public.set_updated_at();

-- ============================================================
-- promotions
-- ============================================================
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  discount_type text not null,
  discount_value numeric(12, 2) not null,
  category_id uuid references public.categories (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_discount_type_check check (discount_type in ('percentage', 'fixed_amount')),
  constraint promotions_discount_value_check check (discount_value > 0),
  constraint promotions_period_check check (ends_at > starts_at),
  -- Exactamente uno de los dos, nunca ambos, nunca ninguno.
  constraint promotions_target_check check (
    (category_id is not null and product_id is null)
    or (category_id is null and product_id is not null)
  )
);

comment on table public.promotions is 'Campañas de descuento con vigencia. Sin equivalente 1:1 en el código actual (old_price/on_sale de hoy son estáticos, sin fecha) -- preparada para el panel, sin dato para sembrar todavía.';

create trigger set_updated_at
  before update on public.promotions
  for each row execute function public.set_updated_at();

-- ============================================================
-- testimonials
-- ============================================================
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  city text,
  rating integer not null,
  comment text not null,
  avatar_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonials_rating_check check (rating between 1 and 5)
);

comment on table public.testimonials is 'Testimonios de clientes (config/testimonials.ts). Sin FK a customers a propósito: contenido de marketing curado a mano, no necesariamente ligado a un pedido registrado.';

create trigger set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ============================================================
-- benefits
-- ============================================================
create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  icon_name text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.benefits is 'Sección "Por qué comprar con nosotros" (config/benefits.ts). icon_name resuelve a un componente de lucide-react en código.';

create trigger set_updated_at
  before update on public.benefits
  for each row execute function public.set_updated_at();

-- ============================================================
-- admins
-- ============================================================
create table public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admins_role_check check (role in ('owner', 'staff'))
);

comment on table public.admins is 'Perfil (nombre + rol) de cada usuario de auth.users que puede entrar al panel. Las credenciales viven enteramente en Supabase Auth, nunca acá.';

create trigger set_updated_at
  before update on public.admins
  for each row execute function public.set_updated_at();

-- ============================================================
-- Helper de RLS: "¿el usuario autenticado actual es un administrador?"
-- Usada por las policies de Storage (migración 003) y de RLS (migración
-- 004). `security definer` + `search_path` fijo es el patrón recomendado
-- por Supabase para evaluar esto sin depender de que la propia policy de
-- `admins` sea visible para quien pregunta.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where id = auth.uid()
  );
$$;
