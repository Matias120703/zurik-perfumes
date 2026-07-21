-- Seed mínimo de arranque para ZURIK Perfumería.
--
-- A diferencia de supabase/seed.sql (que sigue existiendo tal cual, sin
-- tocar, como referencia/documentación del Commerce Engine -- contiene
-- datos de ejemplo de RegiShop, el primer cliente), este archivo es
-- exclusivo de esta instalación y no debe reutilizarse para otro cliente.
--
-- Inserta ÚNICAMENTE la fila única obligatoria de `business_settings`
-- (id = 1). Es la única tabla que el código no tolera vacía:
-- `getPublicBusinessSettings()`/`getPublicBusinessSettingsClient()`/
-- `getBusinessSettings()` hacen `.single()` sobre esta tabla, así que sin
-- exactamente una fila, toda la tienda pública y `/admin/configuracion`
-- fallan al cargar. El resto de las tablas (categories, products,
-- product_images, promotions, benefits, banners, testimonials, customers,
-- orders, admins) quedan deliberadamente vacías -- arranque limpio, sin
-- ningún dato comercial de RegiShop.
--
-- Todos los valores de acá son placeholders genéricos, pensados para
-- reemplazarse de inmediato desde /admin/configuracion una vez creado el
-- primer usuario administrador real:
--   * whatsapp_number: número de prueba, no un WhatsApp real de Zurik.
--   * map_default_lat/lng: Asunción (centro del país), no una ubicación
--     real del negocio -- ajustar a la ciudad real de Zurik.
--   * currency/locale: PYG/es-PY, asumiendo Paraguay como mercado (mismo
--     país que los departamentos/ciudades ya sembrados en
--     seed_logistics.sql). Ajustar si Zurik opera en otro país/moneda.
insert into public.business_settings (
  id,
  store_name,
  whatsapp_number,
  whatsapp_default_message,
  whatsapp_product_inquiry_template,
  currency,
  locale,
  map_default_lat,
  map_default_lng,
  map_default_zoom,
  map_country
) values (
  1,
  'ZURIK Perfumería',
  '595900000000',
  'Hola, quiero hacer una consulta.',
  'Hola, quiero consultar por {product}.',
  'PYG',
  'es-PY',
  -25.2637,
  -57.5759,
  12,
  'Paraguay'
)
on conflict (id) do nothing;
