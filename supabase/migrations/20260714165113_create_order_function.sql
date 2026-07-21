-- Sprint 5.6 (Gestión de Pedidos): convierte el checkout en un flujo que
-- deja el pedido registrado en Supabase antes de abrir WhatsApp.
--
-- `customers`/`orders`/`order_items` siguen con RLS 100% cerrada al
-- público (Fase 8, sin cambios: solo `is_admin()` puede leer/escribir
-- directamente). En vez de agregar policies de "insert" para el rol
-- `anon` en las tres tablas -- lo que dejaría que cualquiera inserte lo
-- que quiera directamente (un total negativo, un status que no sea
-- 'pending', filas sueltas sin sus order_items, etc.) -- se expone una
-- única función RPC, `create_order`, como el único punto de entrada
-- público para crear un pedido. Es `security definer`: corre con los
-- privilegios de quien la creó (no los del rol `anon` que la invoca), así
-- que puede escribir en las tres tablas sin necesitar policies nuevas,
-- pero el público solo puede hacer exactamente lo que esta función deja
-- hacer -- nada más.
--
-- Atomicidad: una función de Postgres se ejecuta dentro de una única
-- transacción implícita. Si cualquier `insert` de acá adentro falla (por
-- ejemplo, un `order_items` con `quantity <= 0`, que la propia tabla
-- rechaza), Postgres revierte automáticamente todo lo que la función ya
-- había insertado en esa misma llamada -- no puede quedar un `orders` sin
-- sus `order_items`. Esta es la garantía real de integridad que pidió el
-- sprint, no un intento de "borrar a mano" si algo sale mal.

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
  p_items jsonb
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
    latitude, longitude, notes, subtotal, total, whatsapp_message
  ) values (
    v_customer_id, p_delivery_method, p_payment_method,
    p_department, p_city, p_neighborhood, p_address, p_reference,
    p_latitude, p_longitude, nullif(p_notes, ''), p_subtotal, p_total, p_whatsapp_message
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

comment on function public.create_order is 'Único punto de entrada público para crear un pedido (Sprint 5.6). security definer: bypassa RLS de customers/orders/order_items (que siguen 100% cerradas a anon) de forma controlada -- el checkout no tiene ninguna otra vía de escritura directa a esas tablas.';

-- Sin esto, ni anon ni authenticated podrían invocar la función (Postgres
-- no otorga EXECUTE por default sobre funciones nuevas en el esquema
-- public de un proyecto Supabase).
grant execute on function public.create_order(
  text, text, text, text, text, text, text, text, text, text, text,
  numeric, numeric, text, numeric, numeric, text, jsonb
) to anon, authenticated;
