-- Sprint 6.2 (módulo de Logística): tarifas de envío completamente
-- administrables desde el Panel, sin ningún costo hardcodeado en el
-- código. Cuatro tablas nuevas + dos columnas en `orders`.
--
-- Diseño (pensado para crecer sin rediseñar el esquema -- el sprint pide
-- explícitamente dejar la base preparada para transportadoras/peso/
-- volumen/distancia/envío gratis en versiones futuras, sin implementarlos
-- todavía):
--   * `departments`/`cities`: catálogo geográfico de Paraguay, normalizado
--     (una ciudad no repite su nombre de departamento, se referencia por
--     `department_id`). Se llenan una única vez por seed
--     (supabase/seed_logistics.sql) -- sin policy de insert/update/delete
--     para nadie: "nunca deberán escribirse manualmente desde el Panel"
--     es una regla de datos, y acá queda además reforzada por RLS.
--   * `shipping_rates`: la tarifa en sí (nombre, precio, tiempo estimado,
--     estado) -- sin ninguna columna de "departamento": el departamento es
--     solo un filtro de conveniencia en el formulario del panel para elegir
--     ciudades más rápido, la relación real vive en `shipping_rate_cities`.
--     Esto es lo que deja la puerta abierta a que una tarifa futura cubra
--     ciudades de más de un departamento sin tocar el esquema.
--   * `shipping_rate_cities`: tabla puente muchos-a-muchos entre tarifas y
--     ciudades (una ciudad puede no estar en ninguna tarifa todavía --
--     "A confirmar" -- pero el diseño no impide que más adelante un motor
--     de reglas más complejo la use distinto).
--   * `orders.shipping_rate_id`/`shipping_rate_name`: igual criterio que
--     `order_items.product_id`/`product_name` (Fase 8) -- FK opcional para
--     trazabilidad (`on delete set null`, una tarifa puede borrarse sin
--     romper pedidos viejos) + snapshot de texto para que el panel no
--     necesite ningún join para mostrar qué tarifa se usó. `orders.department`/
--     `orders.city` (texto, Fase 8) y `orders.shipping_cost` (numeric,
--     Fase 8) ya existían -- no hace falta ninguna columna nueva para
--     "Departamento", "Ciudad" ni "Costo del envío", se siguen usando tal
--     cual, solo que ahora sí se completan de verdad.

-- ============================================================
-- departments
-- ============================================================
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

comment on table public.departments is 'Departamentos de Paraguay (Sprint 6.2). Solo lectura desde la aplicación -- se cargan una única vez por supabase/seed_logistics.sql, nunca desde el Panel.';

create unique index departments_name_key on public.departments (name);

-- ============================================================
-- cities
-- ============================================================
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now()
);

comment on table public.cities is 'Ciudades/distritos de Paraguay (Sprint 6.2), una fila por ciudad -- nunca se repite el nombre del departamento (normalizado vía department_id). Solo lectura desde la aplicación, igual que departments.';

create unique index cities_department_name_key on public.cities (department_id, name);

-- ============================================================
-- shipping_rates
-- ============================================================
create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12, 2) not null,
  estimated_days text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_rates_price_check check (price >= 0)
);

comment on table public.shipping_rates is 'Tarifas de envío administrables desde /admin/logistica (Sprint 6.2). Sin columna de departamento a propósito: el alcance geográfico real vive en shipping_rate_cities, dejando abierta la puerta a una tarifa que cubra ciudades de más de un departamento en el futuro.';

create trigger set_updated_at
  before update on public.shipping_rates
  for each row execute function public.set_updated_at();

create index shipping_rates_active_idx on public.shipping_rates (is_active) where is_active = true;

-- ============================================================
-- shipping_rate_cities (muchos a muchos)
-- ============================================================
create table public.shipping_rate_cities (
  id uuid primary key default gen_random_uuid(),
  shipping_rate_id uuid not null references public.shipping_rates (id) on delete cascade,
  city_id uuid not null references public.cities (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint shipping_rate_cities_unique unique (shipping_rate_id, city_id)
);

comment on table public.shipping_rate_cities is 'Qué ciudades cubre cada tarifa (Sprint 6.2). Una ciudad puede no estar en ninguna fila todavía -- el checkout la trata como "sin tarifa configurada" (costo de envío "A confirmar"), nunca inventa un precio.';

-- Dirección de búsqueda crítica del checkout: "¿qué tarifa cubre esta
-- ciudad?" -- por eso el índice está sobre city_id solo, no sobre el par
-- compuesto (que ya cubre shipping_rate_id como columna líder, pero no
-- sirve para buscar por city_id de forma aislada).
create index shipping_rate_cities_city_id_idx on public.shipping_rate_cities (city_id);

-- ============================================================
-- orders: trazabilidad de qué tarifa se usó (Sprint 6.2)
-- ============================================================
alter table public.orders
  add column shipping_rate_id uuid references public.shipping_rates (id) on delete set null,
  add column shipping_rate_name text;

comment on column public.orders.shipping_rate_id is 'Tarifa de envío usada al confirmar el pedido (Sprint 6.2) -- on delete set null: si la tarifa se borra después, el pedido viejo no se rompe, se apoya en shipping_rate_name para seguir siendo legible.';
comment on column public.orders.shipping_rate_name is 'Snapshot del nombre de la tarifa al momento del pedido (mismo criterio que order_items.product_name, Fase 8) -- evita un join para mostrarlo en el panel.';

-- ============================================================
-- RLS
-- ============================================================

-- departments/cities: lectura para cualquiera (storefront Y panel
-- necesitan los mismos datos geográficos), sin ninguna policy de
-- insert/update/delete -- ni siquiera para admins. La única forma de
-- modificar estas dos tablas es supabase/seed_logistics.sql (o una
-- migración futura), nunca la aplicación.
alter table public.departments enable row level security;

create policy "departments_read"
on public.departments for select
to public
using (true);

alter table public.cities enable row level security;

create policy "cities_read"
on public.cities for select
to public
using (true);

-- shipping_rates: mismo patrón que categories/promotions -- público ve
-- solo activas (el checkout no debe poder calcular un envío con una
-- tarifa desactivada), admin ve y administra todas.
alter table public.shipping_rates enable row level security;

create policy "shipping_rates_public_read_active"
on public.shipping_rates for select
to public
using (is_active = true);

create policy "shipping_rates_admin_read_all"
on public.shipping_rates for select
to authenticated
using (public.is_admin());

create policy "shipping_rates_admin_insert"
on public.shipping_rates for insert
to authenticated
with check (public.is_admin());

create policy "shipping_rates_admin_update"
on public.shipping_rates for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "shipping_rates_admin_delete"
on public.shipping_rates for delete
to authenticated
using (public.is_admin());

-- shipping_rate_cities: sin columna de estado propia (la trae
-- shipping_rates) -- lectura abierta a cualquiera (el checkout necesita
-- poder buscar "¿qué tarifa cubre esta ciudad?" antes de saber si esa
-- tarifa está activa; el filtro real de is_active se aplica explícitamente
-- en la consulta, vía un inner join, mismo criterio que el bug 4 del
-- Sprint 6.0.1: RLS no distingue por sesión, la aplicación filtra además
-- por las dudas). Escritura solo admin.
alter table public.shipping_rate_cities enable row level security;

create policy "shipping_rate_cities_read"
on public.shipping_rate_cities for select
to public
using (true);

create policy "shipping_rate_cities_admin_insert"
on public.shipping_rate_cities for insert
to authenticated
with check (public.is_admin());

create policy "shipping_rate_cities_admin_update"
on public.shipping_rate_cities for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "shipping_rate_cities_admin_delete"
on public.shipping_rate_cities for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- create_order: extendida con los tres parámetros nuevos (Sprint 6.2),
-- agregados al final con default null para no romper ningún llamado
-- existente (supabase-js pasa argumentos con nombre, no posicionales).
-- El total con envío ya lo calcula el cliente (services/storefront/
-- orders.ts) y se lo pasa a p_total, igual que hoy -- esta función sigue
-- sin recalcular nada, solo persiste lo que ya viene resuelto.
--
-- `create or replace` no alcanza acá: agregar parámetros nuevos (aunque
-- sea al final, con default) hace que Postgres lo trate como una firma
-- distinta y cree un segundo overload en vez de reemplazar el original,
-- dejando `public.create_order` ambiguo. Se elimina primero la función
-- con la firma vieja exacta (Fase 15) para que solo quede la nueva.
-- ============================================================
drop function if exists public.create_order(
  text, text, text, text, text, text, text, text, text, text, text,
  numeric, numeric, text, numeric, numeric, text, jsonb
);

create or replace function public.create_order(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_delivery_method text,
  p_payment_method text,
  p_department text,
  p_city text,
  p_neighborhood text,
  p_address text,
  p_reference text,
  p_latitude numeric,
  p_longitude numeric,
  p_notes text,
  p_subtotal numeric,
  p_total numeric,
  p_whatsapp_message text,
  p_items jsonb,
  p_shipping_cost numeric default null,
  p_shipping_rate_id uuid default null,
  p_shipping_rate_name text default null
)
returns table (order_id uuid, order_number bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number bigint;
  v_item jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe tener al menos un producto.';
  end if;

  -- Upsert por teléfono (docs/database-architecture.md, sección 4.3): un
  -- cliente que ya compró antes se reconoce por número, no se duplica.
  insert into public.customers (first_name, last_name, phone, email)
  values (p_first_name, p_last_name, p_phone, nullif(p_email, ''))
  on conflict (phone) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into v_customer_id;

  -- `status` no es un parámetro: todo pedido nuevo entra como 'pending'
  -- (el default de la tabla) -- el público no puede crear un pedido en
  -- cualquier otro estado.
  insert into public.orders (
    customer_id, delivery_method, payment_method,
    department, city, neighborhood, address, reference,
    latitude, longitude, notes, subtotal, total, whatsapp_message,
    shipping_cost, shipping_rate_id, shipping_rate_name
  ) values (
    v_customer_id, p_delivery_method, p_payment_method,
    p_department, p_city, p_neighborhood, p_address, p_reference,
    p_latitude, p_longitude, nullif(p_notes, ''), p_subtotal, p_total, p_whatsapp_message,
    p_shipping_cost, p_shipping_rate_id, p_shipping_rate_name
  )
  returning id, orders.order_number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
    values (
      v_order_id,
      nullif(v_item->>'product_id', '')::uuid,
      v_item->>'product_name',
      (v_item->>'unit_price')::numeric,
      (v_item->>'quantity')::integer,
      (v_item->>'subtotal')::numeric
    );
  end loop;

  return query select v_order_id, v_order_number;
end;
$$;

comment on function public.create_order is 'Único punto de entrada público para crear un pedido (Sprint 5.6, extendida en el Sprint 6.2 con shipping_cost/shipping_rate_id/shipping_rate_name). security definer: bypassa RLS de customers/orders/order_items (que siguen 100% cerradas a anon) de forma controlada -- el checkout no tiene ninguna otra vía de escritura directa a esas tablas.';

grant execute on function public.create_order(
  text, text, text, text, text, text, text, text, text, text, text,
  numeric, numeric, text, numeric, numeric, text, jsonb, numeric, uuid, text
) to anon, authenticated;
