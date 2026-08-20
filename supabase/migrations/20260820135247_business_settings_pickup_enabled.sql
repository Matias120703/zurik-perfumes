-- ¿La tienda ofrece "Retiro en tienda" como método de entrega?
--
-- Default `true` para no cambiar el comportamiento del template ni de
-- ningún otro cliente que sí tenga local físico. ZURIK lo apaga abajo:
-- hoy no tiene local, así que ofrecer esa opción en el checkout llevaría
-- a un pedido que nadie puede retirar en ningún lado.
--
-- Es un dato del negocio, no una constante del código: el día que ZURIK
-- abra un local, se prende desde /admin/configuracion sin tocar nada.
alter table public.business_settings
  add column if not exists pickup_enabled boolean not null default true;

update public.business_settings
set pickup_enabled = false
where id = 1;
