-- ============================================================
-- create_order: guarda también el método de pago elegido
-- ============================================================
--
-- Lección del Sprint 6.2, que se repite acá: agregar parámetros al final
-- con DEFAULT NO reemplaza la función, crea un OVERLOAD y deja
-- `public.create_order` ambiguo. Hay que borrar la firma vieja exacta
-- antes del `create or replace`.

drop function if exists public.create_order(
  text, text, text, text, text, text, text, text, text, text, text,
  numeric, numeric, text, numeric, numeric, text, jsonb,
  numeric, uuid, text
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
  p_shipping_rate_name text default null,
  p_payment_method_id uuid default null,
  p_payment_method_name text default null
)
returns table(order_id uuid, order_number bigint)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number bigint;
  v_item jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe tener al menos un producto.';
  end if;

  -- Upsert por teléfono: un cliente que ya compró antes se reconoce por
  -- número, no se duplica.
  insert into public.customers (first_name, last_name, phone, email)
  values (p_first_name, p_last_name, p_phone, nullif(p_email, ''))
  on conflict (phone) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into v_customer_id;

  -- `status` no es un parámetro: todo pedido nuevo entra como 'pending'.
  insert into public.orders (
    customer_id, delivery_method, payment_method,
    payment_method_id, payment_method_name,
    department, city, neighborhood, address, reference,
    latitude, longitude, notes, subtotal, total, whatsapp_message,
    shipping_cost, shipping_rate_id, shipping_rate_name
  ) values (
    v_customer_id, p_delivery_method, p_payment_method,
    p_payment_method_id, nullif(p_payment_method_name, ''),
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
$function$;
