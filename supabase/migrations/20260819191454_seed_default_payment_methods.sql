-- ============================================================
-- Métodos por defecto: los dos que la tienda ya ofrecía, ahora como
-- datos editables. `instructions` queda en null a propósito -- los datos
-- bancarios reales los carga el administrador desde /admin/pagos.
-- ============================================================
insert into public.payment_methods (name, instructions, is_active, display_order)
select 'Transferencia bancaria', null, true, 0
where not exists (select 1 from public.payment_methods);

insert into public.payment_methods (name, instructions, is_active, display_order)
select 'Efectivo', null, true, 1
where not exists (select 1 from public.payment_methods where name = 'Efectivo');
