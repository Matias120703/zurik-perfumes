-- ============================================================
-- Limpieza de la verificación anterior
-- ============================================================
--
-- Borra el pedido/cliente de prueba usados para confirmar que
-- `create_order` guarda correctamente el método de pago con su firma
-- nueva, y deja `instructions` en null: los datos bancarios reales los
-- carga el dueño desde /admin/pagos -- nunca se siembran datos
-- inventados que un cliente podría llegar a ver.

delete from public.order_items
where order_id in (
  select o.id from public.orders o
  join public.customers c on c.id = o.customer_id
  where c.first_name = 'Prueba' and c.last_name = 'Verificacion'
);

delete from public.orders
where customer_id in (
  select id from public.customers
  where first_name = 'Prueba' and last_name = 'Verificacion'
);

delete from public.customers
where first_name = 'Prueba' and last_name = 'Verificacion';

update public.payment_methods
set instructions = null
where instructions like 'Banco: PRUEBA%';
