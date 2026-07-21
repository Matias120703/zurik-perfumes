-- Sprint 6.0 (Gestión de Inventario, cierre de la Versión 1.0): agrega el
-- control de stock automático que pidió este sprint. Tres piezas nuevas:
--
--   1. Dos columnas en `products` (sku, low_stock_threshold) -- no
--      contempladas en el diseño aprobado de la Fase 8, agregadas acá
--      porque el formulario/tabla de Inventario las pidió explícitamente.
--      No se toca `services/products.ts` ni `ProductForm.tsx` (protegidos
--      este sprint): se editan únicamente desde el módulo nuevo, igual que
--      `icon_name` en `categories` (Fase 13, Sprint 5.4) se resuelve en su
--      propio módulo sin tocar el formulario de Categorías... salvo que acá
--      ni siquiera hace falta: Inventario tiene su propio `services/`.
--   2. `stock_movements`, la tabla de auditoría del historial pedido por
--      el sprint -- cada fila es un movimiento inmutable (mismo criterio
--      que `order_items`: snapshot, sin updated_at).
--   3. `orders.stock_adjusted` + un trigger (`apply_order_stock_movement`)
--      que descuenta/restituye stock automáticamente según el estado del
--      pedido, sin tocar `services/orders.ts` ni `updateOrderStatus()` --
--      la integración vive enteramente en la base de datos, disparada por
--      el mismo `update` que ese archivo (sin cambios) ya hacía.

-- ============================================================
-- products: SKU y stock mínimo
-- ============================================================
alter table public.products
  add column sku text,
  add column low_stock_threshold integer not null default 5,
  add constraint products_low_stock_threshold_check check (low_stock_threshold >= 0);

comment on column public.products.sku is 'Código interno opcional (Sprint 6.0). Gestionado únicamente desde /admin/inventario, no desde ProductForm.';
comment on column public.products.low_stock_threshold is 'Umbral para el estado "Stock bajo" en el panel de Inventario (Sprint 6.0). Default 5, igual al umbral que ya usaba getStockStatus() en la tienda pública desde el Sprint 3.2.';

-- Único cuando tiene valor -- dos productos sin SKU cargado (null) no
-- deben chocar entre sí, pero dos con el mismo código sí.
create unique index products_sku_key on public.products (sku) where sku is not null;

-- ============================================================
-- orders: bandera para no descontar/restituir stock dos veces
-- ============================================================
alter table public.orders
  add column stock_adjusted boolean not null default false;

comment on column public.orders.stock_adjusted is 'True una vez que el trigger apply_order_stock_movement ya descontó el stock de este pedido -- evita descontar de nuevo en confirmed -> preparing -> ready_or_shipped -> delivered, y solo restituye en cancelled si venía en true.';

-- ============================================================
-- stock_movements: historial inmutable de movimientos de stock
-- ============================================================
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  type text not null,
  quantity integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  reason text,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint stock_movements_type_check check (
    type in ('manual_in', 'manual_adjustment', 'order_confirmed', 'order_cancelled')
  ),
  constraint stock_movements_quantity_not_zero_check check (quantity <> 0),
  constraint stock_movements_previous_stock_check check (previous_stock >= 0),
  constraint stock_movements_new_stock_check check (new_stock >= 0),
  -- new_stock siempre debe ser la aplicación real de quantity sobre
  -- previous_stock -- garantiza que el historial nunca pueda mentir sobre
  -- su propia aritmética, incluso si algún día se inserta a mano.
  constraint stock_movements_arithmetic_check check (new_stock = previous_stock + quantity)
);

comment on table public.stock_movements is 'Historial inmutable de cada cambio de stock (Sprint 6.0) -- snapshot, sin updated_at, mismo criterio que order_items. quantity es el delta con signo aplicado (negativo = salida, positivo = entrada).';

alter table public.stock_movements enable row level security;

-- Solo admins -- ni lectura ni escritura pública, mismo criterio que
-- customers/orders/order_items (Fase 8). Sin policy de update/delete: el
-- historial es un registro de auditoría, nunca se corrige ni se borra --
-- un movimiento equivocado se revierte con un movimiento nuevo, no
-- editando el anterior.
create policy "stock_movements_admin_read"
on public.stock_movements for select
to authenticated
using (public.is_admin());

create policy "stock_movements_admin_insert"
on public.stock_movements for insert
to authenticated
with check (public.is_admin());

-- ============================================================
-- register_stock_movement: único punto de entrada para Entrada/Ajuste
-- manual desde el panel. No es security definer -- a diferencia de
-- create_order (Fase 15, invocada por `anon`), esta función siempre la
-- invoca un admin ya autenticado, que ya tiene permiso de RLS para
-- actualizar products e insertar en stock_movements. El chequeo explícito
-- de is_admin() de acá adentro es solo para dar un mensaje de error claro
-- en vez de que RLS lo rechace con un error genérico -- la barrera real
-- sigue siendo RLS, no esta función.
--
-- Garantiza, en una única transacción implícita (mismo principio que
-- create_order): que el stock y el historial se actualicen juntos o
-- ninguno de los dos, y que el stock nunca pueda quedar negativo --
-- "nunca permitir stock negativo" es un `raise exception`, no un clamp
-- silencioso, porque acá el admin cargó la cantidad a mano y merece un
-- error explícito en vez de que su ajuste se recorte sin avisar.
create or replace function public.register_stock_movement(
  p_product_id uuid,
  p_type text,
  p_quantity integer,
  p_reason text
)
returns public.stock_movements
language plpgsql
as $$
declare
  v_previous_stock integer;
  v_new_stock integer;
  v_movement public.stock_movements;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.';
  end if;

  if p_type not in ('manual_in', 'manual_adjustment') then
    raise exception 'Tipo de movimiento no permitido: %.', p_type;
  end if;

  if p_quantity = 0 then
    raise exception 'La cantidad no puede ser cero.';
  end if;

  if p_type = 'manual_in' and p_quantity < 0 then
    raise exception 'Una entrada de stock debe ser una cantidad positiva.';
  end if;

  select stock into v_previous_stock from public.products where id = p_product_id for update;
  if v_previous_stock is null then
    raise exception 'Producto no encontrado.';
  end if;

  v_new_stock := v_previous_stock + p_quantity;
  if v_new_stock < 0 then
    raise exception 'El stock no puede quedar negativo (stock actual: %, ajuste solicitado: %).', v_previous_stock, p_quantity;
  end if;

  update public.products set stock = v_new_stock where id = p_product_id;

  insert into public.stock_movements (product_id, type, quantity, previous_stock, new_stock, reason)
  values (p_product_id, p_type, p_quantity, v_previous_stock, v_new_stock, nullif(p_reason, ''))
  returning * into v_movement;

  return v_movement;
end;
$$;

comment on function public.register_stock_movement is 'Único punto de escritura manual de stock desde /admin/inventario (Sprint 6.0). Actualiza products.stock e inserta el movimiento en la misma transacción implícita; rechaza explícitamente cualquier ajuste que dejaría el stock negativo.';

grant execute on function public.register_stock_movement(uuid, text, integer, text) to authenticated;

-- ============================================================
-- apply_order_stock_movement: descuenta/restituye stock automáticamente
-- según el estado del pedido, sin que services/orders.ts (Pedidos,
-- protegido este sprint) tenga que cambiar una sola línea. Se dispara
-- exactamente con el mismo `update orders set status = ...` que
-- updateOrderStatus() ya hacía desde la Fase 15 -- el trigger es quien se
-- engancha a ese cambio, no al revés.
--
-- Reglas (spec del Sprint 6.0):
--   * Al entrar en un estado "activo" (confirmed/preparing, y también
--     ready_or_shipped/delivered para cubrir el caso de saltarse pasos)
--     sin haber descontado stock todavía: descuenta una única vez y marca
--     stock_adjusted = true.
--   * Al pasar a cancelled habiendo descontado antes: restituye una única
--     vez y marca stock_adjusted = false.
--   * Pendiente -> Pendiente, o cualquier cambio que no cruce ninguno de
--     esos dos bordes, no toca el stock.
--   * La deducción automática nunca puede fallar por un pedido: si el
--     stock real es menor a lo pedido (dato inconsistente, ajuste manual
--     de por medio, etc.), se recorta a 0 con GREATEST(...) en vez de
--     bloquear la confirmación del pedido -- a diferencia del ajuste
--     manual (que si rechaza explícitamente), acá bloquear cambiaría el
--     flujo de Pedidos, explícitamente protegido este sprint.
create or replace function public.apply_order_stock_movement()
returns trigger
language plpgsql
as $$
declare
  v_item record;
  v_previous_stock integer;
  v_new_stock integer;
  v_active_statuses text[] := array['confirmed', 'preparing', 'ready_or_shipped', 'delivered'];
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = any (v_active_statuses) and not old.stock_adjusted then
    for v_item in
      select product_id, quantity from public.order_items
      where order_id = new.id and product_id is not null
    loop
      select stock into v_previous_stock from public.products where id = v_item.product_id for update;
      if v_previous_stock is null then
        continue;
      end if;

      v_new_stock := greatest(v_previous_stock - v_item.quantity, 0);
      update public.products set stock = v_new_stock where id = v_item.product_id;

      insert into public.stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, order_id)
      values (
        v_item.product_id, 'order_confirmed', v_new_stock - v_previous_stock, v_previous_stock, v_new_stock,
        'Pedido #' || new.order_number::text || ' confirmado', new.id
      );
    end loop;
    new.stock_adjusted := true;

  elsif new.status = 'cancelled' and old.stock_adjusted then
    for v_item in
      select product_id, quantity from public.order_items
      where order_id = new.id and product_id is not null
    loop
      select stock into v_previous_stock from public.products where id = v_item.product_id for update;
      if v_previous_stock is null then
        continue;
      end if;

      v_new_stock := v_previous_stock + v_item.quantity;
      update public.products set stock = v_new_stock where id = v_item.product_id;

      insert into public.stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, order_id)
      values (
        v_item.product_id, 'order_cancelled', v_new_stock - v_previous_stock, v_previous_stock, v_new_stock,
        'Pedido #' || new.order_number::text || ' cancelado', new.id
      );
    end loop;
    new.stock_adjusted := false;
  end if;

  return new;
end;
$$;

comment on function public.apply_order_stock_movement is 'Trigger BEFORE UPDATE en orders (Sprint 6.0): descuenta stock al confirmar/preparar un pedido y lo restituye al cancelarlo, con stock_adjusted evitando descontar o restituir dos veces. No es security definer -- corre con los mismos permisos del admin autenticado que ya cambia el estado desde /admin/pedidos (sin modificar ese módulo).';

create trigger apply_order_stock_movement
  before update on public.orders
  for each row execute function public.apply_order_stock_movement();
