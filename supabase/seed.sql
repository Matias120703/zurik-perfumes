-- Datos iniciales, tomados tal cual de config/*.ts -- nada de contenido
-- inventado. El objetivo: al correr este seed sobre las migraciones, la
-- tienda pública debería poder verse exactamente igual que hoy leyendo
-- config/*.ts, pero leyendo estas filas.
--
-- No se siembran (a propósito, sin dato de origen real):
--   * customers / orders / order_items -- no hay ningún pedido real hoy
--     (el carrito vive solo en memoria); inventar un pedido de ejemplo
--     sería inventar contenido, no reutilizarlo.
--   * promotions -- config/promotion.ts modela un banner (-> banners), no
--     una campaña con vigencia; docs/database-architecture.md ya aclara que
--     esta tabla no tiene todavía equivalente 1:1 en el código.
--   * admins -- admins.id debe ser el id de un usuario real de
--     auth.users, que no existe todavía (no hay login). Se crea recién en
--     el sprint del panel/login.
--
-- Se usa "on conflict do nothing" en las tablas con índice único (slug,
-- fila única de business_settings) para que el seed se pueda re-ejecutar
-- sin romper si ya corrió antes; no aplica a las tablas sin clave natural
-- (product_images, benefits, banners, testimonials), que se insertan solo
-- una vez tal como las entrega "supabase db reset" sobre una base limpia.

-- ============================================================
-- business_settings (config/business.ts + config/site.ts + config/footer.ts)
-- ============================================================
insert into public.business_settings (
  id,
  store_name,
  tagline,
  store_description,
  whatsapp_number,
  whatsapp_default_message,
  whatsapp_product_inquiry_template,
  currency,
  locale,
  map_default_lat,
  map_default_lng,
  map_default_zoom,
  map_country,
  map_city,
  contact_email,
  contact_hours,
  contact_address,
  instagram_url,
  facebook_url,
  social_links,
  footer_links
) values (
  1,
  'RegiShop',
  'Productos verificados, atención personalizada y envíos a todo el país.',
  'Encontrá lo que buscás, con envío rápido y atención personalizada.',
  '595981234567',
  'Hola, quiero hacer una consulta.',
  'Hola, quiero consultar por {product}.',
  'PYG',
  'es-PY',
  -25.75,
  -56.4333,
  14,
  'Paraguay',
  'Villarrica',
  'hola@regishop.com',
  'Lun. a vie. de 9 a 18 hs.',
  'Villarrica, Guairá, Paraguay',
  'https://instagram.com/regishop',
  'https://facebook.com/regishop',
  '[
    {"id": "instagram", "label": "Instagram", "href": "https://instagram.com/regishop", "icon": "instagram"},
    {"id": "facebook", "label": "Facebook", "href": "https://facebook.com/regishop", "icon": "facebook"}
  ]'::jsonb,
  '[
    {"id": "envios", "label": "Políticas de envío", "href": "/politicas/envios"},
    {"id": "privacidad", "label": "Privacidad", "href": "/politicas/privacidad"},
    {"id": "terminos", "label": "Términos y condiciones", "href": "/politicas/terminos"},
    {"id": "faq", "label": "Preguntas frecuentes", "href": "/preguntas-frecuentes"}
  ]'::jsonb
)
on conflict (id) do nothing;

-- ============================================================
-- categories (config/categories.ts)
-- ============================================================
insert into public.categories (name, slug, description, image_url, accent_color, display_order)
values
  ('Tecnología', 'tecnologia', 'Gadgets y dispositivos para el día a día.', '/categories/tecnologia.jpg', '#3B82F6', 0),
  ('Hogar', 'hogar', 'Todo para equipar tu casa con estilo.', '/categories/hogar.jpg', '#D97706', 1),
  ('Belleza', 'belleza', 'Cuidado personal y productos de belleza.', '/categories/belleza.jpg', '#E11D8F', 2),
  ('Deportes', 'deportes', 'Equipamiento para mantenerte activo.', '/categories/deportes.jpg', '#059669', 3),
  ('Juguetes', 'juguetes', 'Diversión para todas las edades.', '/categories/juguetes.jpg', '#7C3AED', 4),
  ('Accesorios', 'accesorios', 'Detalles que completan tu look.', '/categories/accesorios.jpg', '#475569', 5)
on conflict (slug) do nothing;

-- ============================================================
-- products (config/products.ts) -- category_id resuelto por slug de
-- categoría, no por un uuid hardcodeado.
-- ============================================================
insert into public.products (
  category_id, name, slug, short_description, price, old_price, stock, featured, on_sale, badge
)
values
  (
    (select id from public.categories where slug = 'tecnologia'),
    'iPhone 14', 'iphone-14',
    'Pantalla Super Retina y cámara profesional en un diseño icónico.',
    850000, 950000, 8, true, true, null
  ),
  (
    (select id from public.categories where slug = 'tecnologia'),
    'AirPods Pro', 'airpods-pro',
    'Cancelación activa de ruido y audio espacial personalizado.',
    210000, null, 15, true, false, 'Más vendido'
  ),
  (
    (select id from public.categories where slug = 'tecnologia'),
    'Smart Watch', 'smart-watch',
    'Monitoreo de salud y notificaciones en tu muñeca.',
    180000, 220000, 3, true, true, null
  ),
  (
    (select id from public.categories where slug = 'hogar'),
    'Licuadora', 'licuadora',
    'Potencia y versatilidad para tu cocina de todos los días.',
    65000, null, 20, true, false, 'Nuevo'
  ),
  (
    (select id from public.categories where slug = 'hogar'),
    'Aspiradora', 'aspiradora',
    'Succión potente y diseño liviano para toda la casa.',
    120000, 145000, 0, true, true, null
  ),
  (
    (select id from public.categories where slug = 'accesorios'),
    'Auriculares Bluetooth', 'auriculares-bluetooth',
    'Sonido envolvente con batería de larga duración.',
    45000, null, 30, true, false, null
  )
on conflict (slug) do nothing;

-- ============================================================
-- product_images (Product.images en config/products.ts) -- product_id
-- resuelto por slug de producto.
-- ============================================================
insert into public.product_images (product_id, url, display_order, alt_text)
values
  ((select id from public.products where slug = 'iphone-14'), '/products/iphone-14-1.jpg', 0, 'iPhone 14'),
  ((select id from public.products where slug = 'iphone-14'), '/products/iphone-14-2.jpg', 1, 'iPhone 14'),
  ((select id from public.products where slug = 'iphone-14'), '/products/iphone-14-3.jpg', 2, 'iPhone 14'),

  ((select id from public.products where slug = 'airpods-pro'), '/products/airpods-pro-1.jpg', 0, 'AirPods Pro'),
  ((select id from public.products where slug = 'airpods-pro'), '/products/airpods-pro-2.jpg', 1, 'AirPods Pro'),
  ((select id from public.products where slug = 'airpods-pro'), '/products/airpods-pro-3.jpg', 2, 'AirPods Pro'),

  ((select id from public.products where slug = 'smart-watch'), '/products/smart-watch-1.jpg', 0, 'Smart Watch'),
  ((select id from public.products where slug = 'smart-watch'), '/products/smart-watch-2.jpg', 1, 'Smart Watch'),
  ((select id from public.products where slug = 'smart-watch'), '/products/smart-watch-3.jpg', 2, 'Smart Watch'),

  ((select id from public.products where slug = 'licuadora'), '/products/licuadora-1.jpg', 0, 'Licuadora'),
  ((select id from public.products where slug = 'licuadora'), '/products/licuadora-2.jpg', 1, 'Licuadora'),
  ((select id from public.products where slug = 'licuadora'), '/products/licuadora-3.jpg', 2, 'Licuadora'),

  ((select id from public.products where slug = 'aspiradora'), '/products/aspiradora-1.jpg', 0, 'Aspiradora'),
  ((select id from public.products where slug = 'aspiradora'), '/products/aspiradora-2.jpg', 1, 'Aspiradora'),
  ((select id from public.products where slug = 'aspiradora'), '/products/aspiradora-3.jpg', 2, 'Aspiradora'),

  ((select id from public.products where slug = 'auriculares-bluetooth'), '/products/auriculares-bluetooth-1.jpg', 0, 'Auriculares Bluetooth'),
  ((select id from public.products where slug = 'auriculares-bluetooth'), '/products/auriculares-bluetooth-2.jpg', 1, 'Auriculares Bluetooth'),
  ((select id from public.products where slug = 'auriculares-bluetooth'), '/products/auriculares-bluetooth-3.jpg', 2, 'Auriculares Bluetooth');

-- ============================================================
-- benefits (config/benefits.ts) -- icon_name es el nombre exportado por
-- lucide-react, resuelto a componente en código.
-- ============================================================
insert into public.benefits (title, description, icon_name, display_order)
values
  ('Compra segura', 'Tus datos y tus pagos siempre protegidos, en cada compra.', 'ShieldCheck', 0),
  ('Atención personalizada', 'Te acompañamos antes, durante y después de tu compra.', 'Headphones', 1),
  ('Envíos a todo el país', 'Recibí tu pedido estés donde estés, sin complicaciones.', 'Truck', 2),
  ('Productos seleccionados', 'Elegimos cada producto pensando en calidad y confianza.', 'BadgeCheck', 3);

-- ============================================================
-- banners (config/promotion.ts -- hoy modela un único banner on/off)
-- ============================================================
insert into public.banners (title, subtitle, image_url, button_text, button_url, background_variant, badge, display_order, is_active)
values (
  'Ofertas imperdibles de esta semana',
  'Descubrí productos seleccionados con precios especiales por tiempo limitado.',
  '/promotions/weekly-offers.jpg',
  'Ver ofertas',
  '/ofertas',
  'dark',
  'PROMOCIÓN',
  0,
  true
);

-- ============================================================
-- testimonials (config/testimonials.ts)
-- ============================================================
insert into public.testimonials (customer_name, city, rating, comment, avatar_url, display_order)
values
  ('Lucía Fernández', 'Villarrica', 5, 'Excelente atención y el pedido llegó muy rápido. Totalmente recomendable.', '/testimonials/lucia-fernandez.jpg', 0),
  ('Martín Gómez', 'Asunción', 5, 'La calidad de los productos superó mis expectativas. Ya hice mi segunda compra.', '/testimonials/martin-gomez.jpg', 1),
  ('Sofía Ramírez', 'Ciudad del Este', 4, 'Muy buena experiencia de compra. El envío tardó un poco más de lo esperado, pero valió la pena.', '/testimonials/sofia-ramirez.jpg', 2),
  ('Diego Torres', 'Encarnación', 5, 'Atención personalizada de verdad: me ayudaron a elegir el producto ideal.', '/testimonials/diego-torres.jpg', 3),
  ('Valentina Ríos', 'Coronel Oviedo', 5, 'Se nota que cuidan cada detalle. Voy a seguir comprando acá.', '/testimonials/valentina-rios.jpg', 4),
  ('Nicolás Acosta', 'Caaguazú', 5, 'Precios justos y una tienda muy confiable. La recomiendo sin dudarlo.', '/testimonials/nicolas-acosta.jpg', 5);
