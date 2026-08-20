-- ============================================================
-- VERIFICACIÓN (sin efecto neto)
-- ============================================================
--
-- Cargó datos bancarios ficticios en "Transferencia bancaria" para poder
-- probar de punta a punta el checkout con instrucciones de pago
-- (mostrarlas, copiarlas, incluirlas en el mensaje de WhatsApp y guardar
-- el pedido). La migración siguiente
-- (20260819192525_tmp_limpieza_datos_verificacion_pagos.sql) las borra.
--
-- Queda registrada porque se aplicó de verdad contra el proyecto y el
-- historial de migraciones tiene que reflejar lo que realmente corrió --
-- no porque aporte nada al esquema. Las dos juntas se cancelan: reaplicar
-- ambas deja `instructions` en null, que es el estado correcto (los datos
-- bancarios reales los carga el dueño desde /admin/pagos).

update public.payment_methods
set instructions = 'Banco: PRUEBA' || chr(10) ||
                   'Titular: PRUEBA PRUEBA' || chr(10) ||
                   'CI: 0.000.000' || chr(10) ||
                   'Cuenta: 000000000'
where name = 'Transferencia bancaria';
