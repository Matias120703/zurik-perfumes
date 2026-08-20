-- ============================================================
-- Completa los campos de `business_settings` que quedaron vacíos en el
-- alta de ZURIK, y corrige el centro del mapa del checkout.
-- ============================================================
--
-- Sólo toca lo que está vacío o lo que sigue con el valor sembrado por
-- defecto: nunca pisa algo que el administrador ya haya cargado desde
-- /admin/configuracion. Por eso es seguro reaplicarla.
--
-- El mapa apuntaba a Asunción mientras `map_city` decía "Ciudad del
-- este" -- 320 km de diferencia, así que quien quería marcar su casa en
-- el mapa del checkout tenía que arrastrarlo medio país antes de
-- empezar.

update public.business_settings
set
  tagline = coalesce(nullif(trim(coalesce(tagline, '')), ''), 'Perfumería árabe & de nicho'),
  store_description = coalesce(
    nullif(trim(coalesce(store_description, '')), ''),
    'Perfumes árabes y de nicho 100% originales, de larga duración. Envíos a todo Paraguay y precios mayoristas para revendedores.'
  ),
  map_default_lat = case
    when round(map_default_lat::numeric, 4) = -25.2637 then -25.5097
    else map_default_lat
  end,
  map_default_lng = case
    when round(map_default_lng::numeric, 4) = -57.5759 then -54.6111
    else map_default_lng
  end,
  map_city = trim(coalesce(map_city, ''))
where id = 1;
