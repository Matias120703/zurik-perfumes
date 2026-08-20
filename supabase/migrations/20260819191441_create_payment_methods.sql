-- ============================================================
-- payment_methods -- Métodos de pago administrables
-- ============================================================
--
-- Hasta acá los dos métodos ("Transferencia bancaria" / "Efectivo")
-- estaban hardcodeados en `PaymentMethod.tsx` + `siteConfig`, y el
-- cliente que elegía transferencia nunca veía a qué cuenta transferir --
-- tenía que preguntarlo por WhatsApp. Esta tabla los vuelve datos:
-- el administrador agrega los que use (transferencia, efectivo, giros,
-- billetera electrónica...) y, en los que lo necesiten, carga las
-- instrucciones de pago que el cliente ve en el checkout y recibe en el
-- mensaje de WhatsApp.
--
-- `instructions` es texto libre y nullable a propósito: "Efectivo" no
-- necesita ninguna, y los datos de una transferencia (banco, titular,
-- CI/RUC, número de cuenta, alias) varían tanto entre bancos y entre
-- países que columnas fijas (`bank_name`, `account_number`, ...) habrían
-- sido más restrictivas y menos útiles que un bloque de texto que el
-- dueño escribe como lo dicta su banco.

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  instructions text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payment_methods_name_not_empty check (length(trim(name)) > 0)
);

create index if not exists payment_methods_active_order_idx
  on public.payment_methods (display_order, name)
  where is_active = true;

drop trigger if exists set_payment_methods_updated_at on public.payment_methods;
create trigger set_payment_methods_updated_at
before update on public.payment_methods
for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: mismo patrón que categories/products -- el público ve sólo los
-- activos, el admin ve y escribe todo.
-- ============================================================
alter table public.payment_methods enable row level security;

drop policy if exists "payment_methods_public_read_active" on public.payment_methods;
create policy "payment_methods_public_read_active"
on public.payment_methods for select
to public
using (is_active = true);

drop policy if exists "payment_methods_admin_read_all" on public.payment_methods;
create policy "payment_methods_admin_read_all"
on public.payment_methods for select
to authenticated
using (public.is_admin());

drop policy if exists "payment_methods_admin_insert" on public.payment_methods;
create policy "payment_methods_admin_insert"
on public.payment_methods for insert
to authenticated
with check (public.is_admin());

drop policy if exists "payment_methods_admin_update" on public.payment_methods;
create policy "payment_methods_admin_update"
on public.payment_methods for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "payment_methods_admin_delete" on public.payment_methods;
create policy "payment_methods_admin_delete"
on public.payment_methods for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- orders: trazabilidad del método elegido
-- ============================================================
--
-- Mismo criterio dual que `shipping_rate_id`/`shipping_rate_name`
-- (Sprint 6.2) y que `order_items.product_id`/`product_name`: la FK es
-- trazabilidad opcional (`on delete set null` -- borrar un método de
-- pago no puede borrar pedidos históricos), y el texto es el snapshot de
-- lo que el cliente eligió, que el panel muestra sin necesitar un join y
-- que no cambia si mañana el admin renombra el método.
alter table public.orders
  add column if not exists payment_method_id uuid references public.payment_methods(id) on delete set null,
  add column if not exists payment_method_name text;

-- `orders.payment_method` tenía un CHECK cerrado a ('transfer','cash'),
-- que hacía imposible cualquier método nuevo. Se relaja a "texto no
-- vacío": los pedidos históricos con 'transfer'/'cash' siguen siendo
-- válidos, y los nuevos guardan el nombre real del método elegido.
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (length(trim(payment_method)) > 0);

create index if not exists orders_payment_method_id_idx
  on public.orders (payment_method_id);

