-- ============================================================
-- Fila única inicial (id = 1) con el contenido de arranque de ZURIK.
-- Va en la misma migración y no en seed.sql porque, a diferencia de los
-- productos/categorías de ejemplo, esta fila NO es contenido de prueba:
-- sin ella, la Home no tendría de dónde leer su barra de anuncios, hero,
-- ofertas ni bloque mayorista. `on conflict do nothing` la hace
-- idempotente -- reaplicar la migración nunca pisa lo que el admin ya
-- editó desde /admin/contenido.
-- ============================================================
insert into public.home_content (
  id,
  announcement_enabled, announcement_messages,
  hero_eyebrow, hero_title, hero_subtitle, hero_badge,
  offers_enabled, offers_eyebrow, offers_title, offers_subtitle,
  wholesale_enabled, wholesale_eyebrow, wholesale_title, wholesale_subtitle,
  wholesale_group_url, wholesale_cta_label, wholesale_whatsapp_message, wholesale_benefits,
  guarantees_enabled, guarantees_eyebrow, guarantees_title, guarantees_subtitle, guarantees
) values (
  1,
  true,
  '["Envíos a todo Paraguay", "100% Originales · Garantía de autenticidad", "¿Querés vender perfumes? Sumate al grupo mayorista", "Atención directa por WhatsApp, todos los días"]'::jsonb,
  'Perfumería árabe & de nicho',
  'Fragancias que se recuerdan',
  'Perfumes originales de larga duración. Rayhaan, Afnan, Rasasi y más, con precios reales y atención directa por WhatsApp.',
  'Ofertas activas esta semana',
  true,
  'Ofertas',
  'Ofertas de la semana',
  'Precios especiales por tiempo limitado. Stock real, cuando se agota se agota.',
  true,
  'Mayoristas',
  'Vendé perfumes con ZURIK',
  'Sumate al grupo mayorista y accedé a precios especiales por cantidad. Te ayudamos a arrancar: catálogo listo, fotos para publicar, precios sugeridos y asesoramiento para que vendas desde el primer día.',
  null,
  'Sumarme al grupo mayorista',
  'Hola! Quiero sumarme al grupo mayorista de ZURIK y acceder a precios especiales.',
  '["Precios mayoristas por cantidad", "Catálogo y fotos listas para publicar", "Empezá sin monto mínimo", "Te asesoramos para vender más"]'::jsonb,
  true,
  'Comprá tranquilo',
  'Por qué elegir ZURIK',
  'Lo que te garantizamos en cada pedido.',
  '[
    {"icon":"badge-check","title":"100% Originales","description":"Todas nuestras fragancias son originales y selladas, con garantía de autenticidad."},
    {"icon":"truck","title":"Envíos a todo Paraguay","description":"Despachamos a todo el país y coordinamos la entrega con vos por WhatsApp."},
    {"icon":"message-circle","title":"Atención directa","description":"Hablás siempre con una persona real, antes, durante y después de tu compra."},
    {"icon":"hand-coins","title":"Precios mayoristas","description":"Si querés revender, accedés a precios especiales por cantidad desde el primer pedido."}
  ]'::jsonb
)
on conflict (id) do nothing;
