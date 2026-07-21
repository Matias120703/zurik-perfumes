# Arquitectura de Base de Datos — Somapp Commerce Engine

> **Estado:** Diseño conceptual aprobado (Sprint 4.0). **No implementado todavía.**
> Este documento define el modelo de datos oficial que usará Somapp Commerce Engine cuando se conecte Supabase (roadmap, `CLAUDE.md` sección 8). No contiene SQL ni migraciones — eso es un sprint futuro. Es la base que cualquier tienda nueva construida con esta plantilla va a reutilizar tal cual, cambiando solo el contenido de las filas, nunca la estructura.

---

## 1. Alcance y metodología

Este diseño **no se inventó desde cero**: sale de leer el código real del proyecto — cada `type` de dominio, cada archivo de `config/`, el store del carrito, el formulario de checkout y el generador de mensajes de WhatsApp — y traducir exactamente esos datos a tablas. Se revisó, en este orden:

| Parte del proyecto | Archivo(s) fuente | Qué aportó al diseño |
|---|---|---|
| Home | `config/site.ts`, `config/benefits.ts`, `config/testimonials.ts`, `config/promotion.ts`, `config/footer.ts`, `config/navigation.ts` | Tablas `benefits`, `testimonials`, `banners`, columnas de `business_settings` |
| Catálogo | `config/categories.ts`, `app/productos/page.tsx` | Tabla `categories` |
| Producto | `config/products.ts`, `lib/products.ts` | Tabla `products` (incluye `featured`, `onSale`, `stock`, `badge`, descuentos) |
| Carrito | `store/cart-store.ts` (`CartLineItem`) | Forma de `order_items` (producto + cantidad) |
| Checkout | `lib/checkout.ts` (`CheckoutFormValues`) | Tablas `customers` y `orders` (contacto, entrega, pago, notas, lat/lng) |
| Confirmación | `components/storefront/OrderConfirmationDetails.tsx` | Qué datos de un pedido deben quedar persistidos y visibles después |
| WhatsApp | `lib/whatsapp.ts` | Columna `orders.whatsapp_message` (el texto ya se arma hoy; solo falta guardarlo) |

**Regla seguida en todo el diseño:** si un dato no existe hoy en ningún componente, config o tipo del proyecto, no entra en el modelo — se documenta como posible extensión futura, nunca como tabla o columna "por las dudas".

---

## 2. Principios de diseño (aplicación directa de `CLAUDE.md`)

1. **Sin tabla `tenants`, nunca.** Cada cliente tiene su propio proyecto de Supabase (Filosofía, sección 2 de `CLAUDE.md`). Por eso **ninguna** tabla de este esquema tiene una columna `tenant_id`/`store_id`: toda la base de datos pertenece implícitamente a un solo negocio.
2. **Pensado para un local, no para un marketplace.** No hay variantes de producto (talle/color), multi-moneda, multi-vendedor, multi-depósito, cupones ni suscripciones. Si el proyecto los necesita algún día, es una extensión — no una carencia de este diseño.
3. **Snapshots donde hay dinero de por medio.** Un pedido nunca debe cambiar de total porque alguien editó el precio de un producto un mes después. Por eso `order_items` guarda `product_name` y `unit_price` propios, no solo un `product_id`.
4. **Config de código para lo que casi no cambia; tabla para lo que el dueño va a querer tocar seguido.** La navegación principal (`mainNav`) sigue siendo código — nadie pidió un editor de menú. Los testimonios, banners y productos sí necesitan poder cambiar desde un panel sin tocar código.
5. **Nombres de tabla/columna en `snake_case`**, como es convención en Postgres/Supabase. La capa de acceso a datos (futuro `lib/supabase/`) es la única responsable de traducir esas filas a los `type` en camelCase que ya existen (`Product`, `Category`, etc.) — **ningún componente cambia**, tal como exige el principio 3 de `CLAUDE.md`.

---

## 3. Mapa de relaciones (vista general)

```
categories 1───N products 1───N product_images
                  │
                  │ (opcional)
                  ├───N promotions ──┐
                  │                  │  (una promoción apunta a
categories ───────┘                  │   UNA categoría O UN producto,
        (opcional) ───N promotions ──┘   nunca a ambos)

customers 1───N orders 1───N order_items N───1 products (FK opcional)

auth.users (Supabase Auth) 1───1 admins

business_settings   banners   testimonials   benefits
   (tablas de contenido plano, sin relaciones entre sí)
```

Doce tablas en total — las once que pediste, más `product_images` (justificada en la sección 4.2: es la sub-tabla que ya necesita la galería de fotos que `ProductGallery` tiene construida desde el Sprint 3.2).

---

## 4. Tablas

Cada tabla sigue el mismo formato: propósito, columnas, clave primaria, claves foráneas, índices, restricciones y campos opcionales.

### 4.1 `categories`

**Propósito:** las categorías del catálogo (hoy `config/categories.ts`). Una tienda chica tiene pocas (6 en RegiShop) y casi no cambian de estructura, pero sí de contenido (nombre, imagen, orden).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador interno |
| `name` | `text` | Nombre visible ("Tecnología") |
| `slug` | `text` | Usado en URLs (`/categorias/tecnologia`) |
| `description` | `text` | Bajada corta, igual a `Category.description` |
| `image_url` | `text` | Imagen de portada (Supabase Storage) |
| `accent_color` | `text` | Hex opcional, igual a `Category.accentColor` |
| `display_order` | `integer` | Orden manual en Home/Catálogo (default `0`) |
| `is_active` | `boolean` | Ocultar sin borrar (default `true`) |
| `created_at` / `updated_at` | `timestamptz` | Auditoría estándar |

- **Clave primaria:** `id`.
- **Claves foráneas:** ninguna.
- **Índices:** único en `slug`; índice en `display_order` (orden de listados); índice parcial en `is_active = true` (la consulta más común del storefront: "categorías activas, en orden").
- **Restricciones:** `slug` y `name` `NOT NULL`; `slug` único.
- **Campos opcionales:** `image_url`, `accent_color` (hoy mismo son opcionales en el `type Category`).

---

### 4.2 `products` + `product_images`

**Propósito:** el catálogo de productos (`config/products.ts`). Se separó en dos tablas — no una — por una razón concreta y ya existente en el código: `Product.images` es un array (`string[]`) porque `ProductGallery` (Sprint 3.2) ya muestra varias fotos con cross-fade. Un array plano de texto serviría para *mostrar* las fotos, pero no para *administrarlas* bien: un panel admin necesita poder borrar una sola foto, reordenarlas por drag-and-drop o marcar cuál es la principal — eso se modela mucho mejor con filas que con un array.

#### `products`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador interno |
| `category_id` | `uuid` | Categoría a la que pertenece |
| `name` | `text` | Nombre del producto |
| `slug` | `text` | Usado en `/productos/[slug]` |
| `short_description` | `text` | Bajada corta de la página de producto |
| `price` | `numeric(12,2)` | Precio actual. `numeric`, no `float`, para no perder centavos |
| `old_price` | `numeric(12,2)` | Precio anterior (tachado), igual a `Product.oldPrice` |
| `stock` | `integer` | Unidades disponibles |
| `featured` | `boolean` | Aparece en "Productos Destacados" de la Home |
| `on_sale` | `boolean` | Muestra el badge de descuento (independiente de `old_price`, igual que hoy en el código) |
| `badge` | `text` | Texto libre ("Más vendido", "Nuevo") |
| `created_at` / `updated_at` | `timestamptz` | Auditoría |

- **Clave primaria:** `id`.
- **Clave foránea:** `category_id → categories.id`, `ON DELETE RESTRICT` (no se puede borrar una categoría mientras tenga productos — obliga a reasignarlos primero, evita productos huérfanos).
- **Índices:** único en `slug`; índice en `category_id` (filtro de catálogo por categoría, la consulta más frecuente); índice parcial en `featured = true` (Home); índice parcial en `on_sale = true`.
- **Restricciones:** `price >= 0`; `stock >= 0`; si `old_price` no es nulo, `old_price > price`; `slug` único; `category_id NOT NULL`.
- **Campos opcionales:** `old_price`, `badge`.

#### `product_images`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador interno |
| `product_id` | `uuid` | Producto al que pertenece |
| `url` | `text` | URL de la imagen (Supabase Storage) |
| `display_order` | `integer` | Orden dentro de la galería (default `0`) |
| `alt_text` | `text` | Texto alternativo para accesibilidad |

- **Clave primaria:** `id`.
- **Clave foránea:** `product_id → products.id`, `ON DELETE CASCADE` (si se borra el producto, sus fotos no tienen sentido solas).
- **Índices:** compuesto en `(product_id, display_order)` — es exactamente cómo se va a pedir la galería: "las fotos de este producto, en orden".
- **Restricciones:** `url NOT NULL`.
- **Campos opcionales:** `alt_text`.

---

### 4.3 `customers`

**Propósito:** identidad de quien compra. Hoy el checkout no tiene login — cada compra vuelve a pedir nombre/teléfono/email (`CheckoutFormValues`). Esta tabla existe para que, al guardar un pedido, se pueda reconocer a un cliente que ya compró antes (por teléfono, que es el identificador natural en una tienda que vende por WhatsApp) y ver su historial desde el panel — no para requerir una cuenta ni una contraseña.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador interno |
| `first_name` | `text` | Nombre |
| `last_name` | `text` | Apellido |
| `phone` | `text` | Teléfono — identificador natural (WhatsApp) |
| `email` | `text` | Opcional, igual que en el checkout actual |
| `created_at` / `updated_at` | `timestamptz` | Auditoría |

- **Clave primaria:** `id`.
- **Claves foráneas:** ninguna.
- **Índices:** único en `phone` (permite un `upsert` por teléfono: "si ya existe este teléfono, reutilizar el cliente; si no, crearlo").
- **Restricciones:** `phone NOT NULL UNIQUE`; `first_name`/`last_name NOT NULL`.
- **Campos opcionales:** `email`.

**Decisión explícita:** la dirección de entrega **no** vive acá. Un mismo cliente puede pedir delivery a distintas direcciones en distintas compras (exactamente como ya funciona el checkout hoy, que no guarda ninguna dirección "de perfil"). La dirección es un dato del *pedido*, no del *cliente* — vive en `orders`.

---

### 4.4 `orders` + `order_items`

**Propósito:** el pedido en sí y su detalle producto por producto. Es la tabla más importante del esquema: junta todo lo que hoy `OrderConfirmationDetails` muestra en pantalla y `lib/whatsapp.ts` convierte en mensaje.

#### `orders`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador interno |
| `order_number` | `bigint` (identity, autoincremental) | Número corto para humanos ("Pedido #48") — el dueño de la tienda no debería tener que leer un UUID |
| `customer_id` | `uuid` | Cliente que hizo el pedido |
| `status` | `text` | `'pending' \| 'confirmed' \| 'preparing' \| 'ready_or_shipped' \| 'delivered' \| 'cancelled'` |
| `delivery_method` | `text` | `'delivery' \| 'pickup'` — igual a `DeliveryMethod` |
| `payment_method` | `text` | `'transfer' \| 'cash'` — igual a `PaymentMethodValue` |
| `department`, `city`, `neighborhood`, `address`, `reference` | `text` | Igual a los campos de `ShippingInformation`; solo aplican si `delivery_method = 'delivery'` |
| `latitude`, `longitude` | `numeric` | Del `LocationPicker` (Sprint 3.7) |
| `notes` | `text` | Notas del pedido |
| `subtotal` | `numeric(12,2)` | Snapshot del subtotal al momento de comprar |
| `shipping_cost` | `numeric(12,2)` | Hoy no existe cálculo real (placeholder "se calcula en el próximo paso"); columna lista para cuando exista |
| `total` | `numeric(12,2)` | Snapshot del total |
| `whatsapp_message` | `text` | El texto exacto que generó `buildOrderWhatsAppMessage()` — auditoría de qué se le mandó realmente al negocio |
| `created_at` / `updated_at` | `timestamptz` | Auditoría |

- **Clave primaria:** `id`.
- **Clave foránea:** `customer_id → customers.id`, `ON DELETE RESTRICT` (nunca se debería poder borrar un cliente y perder sus pedidos).
- **Índices:** único en `order_number`; índice en `customer_id` ("pedidos de este cliente"); índice en `status` (panel filtrando por estado); índice en `created_at DESC` (orden cronológico, el más común en cualquier listado de pedidos).
- **Restricciones:** `subtotal >= 0`, `total >= 0`; `status`/`delivery_method`/`payment_method` limitados a sus valores válidos (`CHECK`, no `ENUM` nativo — ver justificación en sección 6); si `delivery_method = 'delivery'`, entonces `department`, `city` y `address` no pueden ser nulos (restricción cruzada, exactamente lo que hoy hace la validación HTML5 del formulario).
- **Campos opcionales:** todos los de dirección y lat/lng (solo si es Delivery), `reference`, `notes`, `shipping_cost`, `whatsapp_message`.

#### `order_items`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador interno |
| `order_id` | `uuid` | Pedido al que pertenece |
| `product_id` | `uuid` (nullable) | Producto comprado, si todavía existe |
| `product_name` | `text` | **Snapshot** del nombre al momento de la compra |
| `unit_price` | `numeric(12,2)` | **Snapshot** del precio unitario al momento de la compra |
| `quantity` | `integer` | Cantidad comprada |
| `subtotal` | `numeric(12,2)` | `unit_price * quantity`, guardado (no recalculado en cada lectura) |

- **Clave primaria:** `id`.
- **Claves foráneas:** `order_id → orders.id`, `ON DELETE CASCADE` (el detalle no existe sin el pedido); `product_id → products.id`, `ON DELETE SET NULL` (si el producto se borra del catálogo más adelante, el pedido histórico no debe desaparecer ni romperse — solo pierde el link "vivo" al producto, pero conserva `product_name`/`unit_price`).
- **Índices:** índice en `order_id` (traer todas las líneas de un pedido); índice en `product_id` (a futuro: "cuántas veces se vendió este producto").
- **Restricciones:** `quantity > 0`; `unit_price >= 0`.
- **Campos opcionales:** `product_id` (por el `ON DELETE SET NULL`).

**Por qué el snapshot y no solo un `JOIN` a `products`:** si mañana el dueño de la tienda cambia el precio de un producto o le cambia el nombre, los pedidos ya confirmados **no pueden cambiar retroactivamente** — el cliente pagó (o va a pagar) el precio que vio en su momento. Guardar `product_name`/`unit_price` en cada línea es el mínimo necesario para que el historial de pedidos sea confiable.

---

### 4.5 `business_settings`

**Propósito:** la configuración del negocio (`config/business.ts` + parte de `config/site.ts` y `config/footer.ts`). Es una tabla **de una sola fila** — no hay "varios negocios" dentro de una misma base de datos (Filosofía, sección 2: un negocio = una base). Modelarla como tabla en vez de una fila hardcodeada en código es lo que le permite al panel administrativo tener una pantalla de "Ajustes" editable sin redeploy.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `integer` | Siempre `1` (fila única, ver restricción) |
| `store_name` | `text` | Nombre de la tienda |
| `store_description` | `text` | Bajada general (Home, metadata) |
| `whatsapp_number` | `text` | Igual a `businessConfig.whatsapp.number` |
| `whatsapp_default_message` | `text` | Igual a `whatsapp.defaultMessage` |
| `whatsapp_product_inquiry_template` | `text` | Igual a `whatsapp.productInquiryTemplate` |
| `currency` | `text` | ISO 4217 (`PYG`) |
| `locale` | `text` | (`es-PY`) |
| `map_default_lat`, `map_default_lng` | `numeric` | Centro inicial del `LocationPicker` |
| `map_default_zoom` | `integer` | Zoom inicial |
| `contact_email`, `contact_hours`, `contact_address` | `text` | Igual a `footerConfig.contact` |
| `social_links` | `jsonb` | Array `[{ id, label, href, icon }]` — ver justificación abajo |
| `footer_links` | `jsonb` | Array `[{ id, label, href }]` (políticas, FAQ, etc.) |
| `created_at` / `updated_at` | `timestamptz` | Auditoría |

- **Clave primaria:** `id`, con `CHECK (id = 1)` para forzar que exista una única fila.
- **Claves foráneas:** ninguna.
- **Índices:** ninguno especial — es una fila, se trae siempre entera.
- **Restricciones:** singleton (`id = 1`); `whatsapp_number`, `currency`, `locale`, `store_name` `NOT NULL`.
- **Campos opcionales:** `store_description`, `contact_*`.

**Por qué `social_links` y `footer_links` son columnas `jsonb` y no tablas propias:** son listas cortas (2-6 ítems), sin identidad propia relevante para consultas (nadie va a "buscar un link de Instagram" ni paginar redes sociales), y siempre se leen/editan junto con el resto de la configuración del negocio, nunca de forma independiente. Convertirlas en tablas (`social_links`, `footer_links`) agregaría dos tablas más sin ningún beneficio relacional real — exactamente el tipo de complejidad innecesaria que este sprint pide eliminar. `jsonb` en Postgres es nativo, indexable si hiciera falta, y el panel puede editarlo como un array simple.

---

### 4.6 `banners`

**Propósito:** el banner promocional genérico de la Home (`config/promotion.ts` / `PromotionalBanner`). Hoy solo existe uno (`enabled` lo prende o apaga), pero modelarlo como tabla (en vez de fila única como `business_settings`) permite tener más de uno a futuro sin cambiar el esquema — sin necesidad de resolver eso ahora.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador interno |
| `title` | `text` | Título del banner |
| `subtitle` | `text` | Bajada |
| `image_url` | `text` | Imagen de fondo |
| `button_text`, `button_url` | `text` | CTA |
| `background_variant` | `text` | `'dark' \| 'light'`, igual a `PromotionBackgroundVariant` |
| `badge` | `text` | Texto tipo "PROMOCIÓN" |
| `display_order` | `integer` | Orden si hay más de uno |
| `is_active` | `boolean` | Reemplaza al `enabled` actual |
| `created_at` / `updated_at` | `timestamptz` | Auditoría |

- **Clave primaria:** `id`.
- **Claves foráneas:** ninguna.
- **Índices:** parcial en `is_active = true`.
- **Restricciones:** `title NOT NULL`; `background_variant` limitado a sus dos valores válidos.
- **Campos opcionales:** `subtitle`, `image_url`, `button_text`, `button_url`, `badge` (todos ya opcionales o con placeholder en el `type` actual).

---

### 4.7 `promotions`

**Propósito:** esta es la única tabla del diseño que **no** tiene un equivalente 1:1 en el código de hoy — el proyecto actual solo modela un descuento estático por producto (`old_price` + `on_sale`, ambos fijos, sin fecha de inicio/fin). `promotions` es deliberadamente simple: existe para que el futuro panel pueda armar una campaña con vigencia ("15% off en Tecnología, del 1 al 15 de diciembre") sin que el dueño tenga que editar producto por producto. La forma en que una promoción activa se refleja en el storefront (actualizando `products.on_sale`/`old_price`, vía un job o al guardar) es una decisión de implementación fuera de este sprint — acá solo se modela el dato.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador interno |
| `title` | `text` | Nombre de la campaña |
| `description` | `text` | Detalle opcional |
| `discount_type` | `text` | `'percentage' \| 'fixed_amount'` |
| `discount_value` | `numeric(12,2)` | Valor del descuento |
| `category_id` | `uuid` (nullable) | A qué categoría aplica |
| `product_id` | `uuid` (nullable) | A qué producto aplica |
| `starts_at` | `timestamptz` | Inicio de vigencia |
| `ends_at` | `timestamptz` | Fin de vigencia |
| `is_active` | `boolean` | Apagado manual, independiente de las fechas |
| `created_at` / `updated_at` | `timestamptz` | Auditoría |

- **Clave primaria:** `id`.
- **Claves foráneas:** `category_id → categories.id` (nullable); `product_id → products.id` (nullable).
- **Índices:** índice en `category_id`; índice en `product_id`; índice compuesto en `(starts_at, ends_at)` (consulta típica: "promociones vigentes ahora mismo").
- **Restricciones:** `ends_at > starts_at`; `discount_value > 0`; exactamente uno de `category_id`/`product_id` debe estar presente (nunca los dos, nunca ninguno — una promoción "a todo el catálogo" queda deliberadamente fuera de esta versión, por simplicidad).
- **Campos opcionales:** `description`.

**Qué se descartó a propósito acá:** códigos de cupón, descuentos apilables, mínimos de compra, límite de usos. Nada de eso existe en la UI actual ni fue pedido — es exactamente el tipo de complejidad "estilo Shopify" que este sprint pide evitar.

---

### 4.8 `testimonials`

**Propósito:** `config/testimonials.ts`. Contenido de marketing curado a mano por el dueño de la tienda (copiado de un chat de WhatsApp, una reseña de Google, etc.), no un dato transaccional.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador interno |
| `customer_name` | `text` | Nombre a mostrar |
| `city` | `text` | Ciudad |
| `rating` | `integer` | 1 a 5 |
| `comment` | `text` | Comentario |
| `avatar_url` | `text` | Foto (placeholder hoy) |
| `display_order` | `integer` | Orden en la sección |
| `is_active` | `boolean` | Ocultar sin borrar |
| `created_at` / `updated_at` | `timestamptz` | Auditoría |

- **Clave primaria:** `id`.
- **Claves foráneas:** **ninguna, a propósito.** `customer_name` es texto libre, no una referencia a `customers.id`. Un testimonio real casi nunca corresponde 1:1 a un pedido registrado en el sistema (reseñas externas, capturas de pantalla, clientes de antes de tener la tienda online) — forzar una FK a `customers` rompería el caso de uso real.
- **Índices:** parcial en `is_active = true`.
- **Restricciones:** `rating BETWEEN 1 AND 5`; `customer_name`/`comment NOT NULL`.
- **Campos opcionales:** `city`, `avatar_url`.

---

### 4.9 `benefits`

**Propósito:** `config/benefits.ts`, la sección "¿Por qué comprar con nosotros?". Cambia muy poco, pero igual se pidió como tabla — se modela simple.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador interno |
| `title` | `text` | Título del beneficio |
| `description` | `text` | Bajada |
| `icon_name` | `text` | Nombre del ícono de `lucide-react` (ej. `"ShieldCheck"`), resuelto a componente en código vía un mapa `{ [name]: LucideIcon }` — no se puede guardar un componente de React en una base de datos |
| `display_order` | `integer` | Orden en la sección |
| `is_active` | `boolean` | Ocultar sin borrar |

- **Clave primaria:** `id`.
- **Claves foráneas:** ninguna.
- **Índices:** ninguno especial — tabla chica, se trae completa y activa.
- **Restricciones:** `title`, `description`, `icon_name` `NOT NULL`.
- **Campos opcionales:** ninguno relevante — todos los campos son necesarios para renderizar la sección.

---

### 4.10 `admins`

**Propósito:** quién puede entrar al futuro panel administrativo. **No** es un sistema de login propio: usa Supabase Auth para todo lo sensible (contraseñas, tokens, recuperación de cuenta) y esta tabla es solo el "perfil" — nombre y rol — de cada usuario ya autenticado.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | **Mismo valor que `auth.users.id`** (no un id propio) |
| `full_name` | `text` | Nombre para mostrar en el panel |
| `role` | `text` | `'owner' \| 'staff'` |
| `created_at` | `timestamptz` | Auditoría |

- **Clave primaria y foránea a la vez:** `id`, que referencia `auth.users.id` (la tabla de usuarios que administra Supabase Auth), `ON DELETE CASCADE` — si se elimina el usuario de Auth, se elimina su perfil de admin. Es el patrón estándar de Supabase para "tabla de perfil 1 a 1 con un usuario autenticado".
- **Índices:** ninguno especial además de la clave primaria.
- **Restricciones:** `full_name NOT NULL`; `role` limitado a sus dos valores.
- **Campos opcionales:** ninguno.

**Por qué no hay columna de email/contraseña acá:** eso es responsabilidad exclusiva de Supabase Auth (`auth.users`). Duplicar credenciales en una tabla propia sería reinventar (peor) algo que Supabase ya resuelve de forma segura.

---

## 5. Relaciones — resumen explícito

| Relación | Tipo | Explicación |
|---|---|---|
| `categories` → `products` | Uno a muchos | Una categoría tiene muchos productos; cada producto pertenece a **una sola** categoría (no hay muchos-a-muchos: así es como ya funciona `Product.category` hoy). |
| `products` → `product_images` | Uno a muchos | Un producto tiene muchas fotos; cada foto pertenece a un solo producto. |
| `customers` → `orders` | Uno a muchos | Un cliente puede tener muchos pedidos a lo largo del tiempo; cada pedido pertenece a un solo cliente. |
| `orders` → `order_items` | Uno a muchos | Un pedido tiene muchas líneas de detalle; cada línea pertenece a un solo pedido. |
| `products` → `order_items` | Uno a muchos (FK opcional) | Un producto puede aparecer en muchas líneas de pedido a lo largo del tiempo; cada línea referencia como máximo un producto (o ninguno, si fue borrado del catálogo). |
| `categories` → `promotions` | Uno a muchos (opcional) | Una categoría puede tener varias promociones a lo largo del tiempo; cada promoción apunta a una categoría **o** a un producto, nunca a ambos. |
| `products` → `promotions` | Uno a muchos (opcional) | Ídem, del lado del producto. |
| `auth.users` → `admins` | Uno a uno | Cada usuario autenticado tiene, como máximo, un perfil de administrador. |
| `business_settings`, `banners`, `testimonials`, `benefits` | Sin relaciones | Tablas de contenido plano: se leen completas (o filtradas por `is_active`), no participan de ningún `JOIN` estructural. |

---

## 6. Cómo encaja con Supabase

- **Postgres puro:** todo lo diseñado son tablas, tipos y restricciones estándar de Postgres — nada propietario de Supabase, cero *vendor lock-in* más allá de lo que ya implica usar Postgres.
- **UUIDs por defecto:** todas las claves primarias usan `uuid` generado con `gen_random_uuid()` (extensión `pgcrypto`, disponible por defecto en cualquier proyecto de Supabase).
- **`text` + `CHECK` en vez de `ENUM` nativo:** para `status`, `delivery_method`, `payment_method`, `discount_type`, `background_variant` y `role` se eligió `text` con una restricción `CHECK`, no un tipo `ENUM` de Postgres. Motivo: agregar un valor nuevo a un `CHECK` es una migración simple (`ALTER TABLE ... DROP CONSTRAINT / ADD CONSTRAINT`); agregar un valor a un `ENUM` nativo es más rígido en Postgres. Para una tienda chica que va a querer, por ejemplo, sumar un estado de pedido nuevo ("en camino") sin dolor, `CHECK` es la opción más simple de mantener.
- **Row Level Security (RLS), a nivel de estrategia (sin políticas escritas todavía):**
  - Lectura pública (rol `anon`), **de solo lectura**: `categories`, `products`, `product_images`, `banners`, `promotions` (activas y vigentes), `testimonials` (activos), `benefits` (activos), y las columnas no sensibles de `business_settings`. Es exactamente lo que hoy consume el storefront sin login.
  - Sin lectura pública: `customers`, `orders`, `order_items`. El día que el checkout escriba en Supabase en vez de (o adicionalmente a) abrir WhatsApp, la policy debería permitir **solo `INSERT`** desde `anon` (crear el pedido), nunca `SELECT` — un cliente no debe poder leer pedidos ajenos.
  - Escritura de cualquier tabla de catálogo/contenido: solo si `auth.uid()` existe en `admins`.
  - `admins`: cada usuario solo puede leer/editar su propia fila (`auth.uid() = id`).
- **Supabase Storage:** todas las columnas `*_url` (`product_images.url`, `categories.image_url`, `testimonials.avatar_url`, `banners.image_url`) van a apuntar a archivos en buckets de Storage — hoy son rutas placeholder (`/products/iphone-14-1.jpg`), el día de mañana son URLs públicas de Storage. No cambia el tipo de columna (sigue siendo `text`).
- **Supabase Auth:** `admins` se apoya 100% en `auth.users` para login — encaja con el punto 9 del roadmap de `CLAUDE.md` ("Autenticación (Supabase Auth) si el panel lo requiere").
- **Tipos generados:** Supabase puede generar tipos TypeScript automáticamente desde este esquema (`supabase gen types typescript`). Esos tipos son para la capa interna de acceso a datos (`lib/supabase/`), **no** reemplazan a `Product`, `Category`, `CheckoutFormValues`, etc. — la función que hoy es `getProductBySlug(slug)` simplemente se vuelve `async` y traduce la fila de `products` (+ sus `product_images`) al mismo `Product` de siempre. Ningún componente de `components/` se entera del cambio (principio 3, `CLAUDE.md`).

---

## 7. Cómo usará cada tabla el futuro panel administrativo

| Tabla | Pantalla / uso en el panel |
|---|---|
| `products` + `product_images` | ABM de productos: crear/editar/eliminar, subir y reordenar fotos, ajustar stock y precio. |
| `categories` | ABM de categorías, reordenar (`display_order`), activar/desactivar. |
| `orders` + `order_items` | Listado de pedidos filtrable por `status`/fecha; detalle de cada pedido (líneas, dirección, mapa con lat/lng, mensaje de WhatsApp enviado); cambio manual de estado. |
| `customers` | Listado con buscador por teléfono/nombre; ver historial de pedidos de cada cliente (derivado de `orders`, no una pantalla de alta manual salvo para pedidos telefónicos). |
| `business_settings` | Una única pantalla de "Ajustes del negocio" (formulario, no listado): WhatsApp, moneda, mapa, redes sociales y links del footer. |
| `banners` | ABM simple con vista previa, para la sección promocional de la Home. |
| `promotions` | Alta de campañas con selector de categoría/producto y rango de fechas; listado de vigentes/vencidas. |
| `testimonials` | ABM: cargar, editar, ocultar sin borrar (`is_active`). |
| `benefits` | ABM simple (cambia poco, pero queda disponible). |
| `admins` | Invitar nuevos administradores (vía Supabase Auth), asignar `role`. |

---

## 8. Decisiones de arquitectura — qué se incluyó y qué se descartó

**Incluido, con justificación puntual (ya cubierta en cada tabla):**
- `product_images` como tabla propia en vez de un array de texto en `products` (necesidad real: la galería ya existe).
- Snapshots (`product_name`, `unit_price`) en `order_items` (necesidad real: integridad histórica de pedidos).
- `order_number` autoincremental además del `uuid` (necesidad real: un dueño de tienda no va a decir "pedido a1b2c3d4").
- `jsonb` para `social_links`/`footer_links` en vez de tablas propias (elimina dos tablas que no aportarían nada relacional).

**Descartado explícitamente, para no sobre-diseñar:**
- Tabla `tenants` o cualquier columna `store_id`/`tenant_id` — contradice la Filosofía del proyecto (sección 2 de `CLAUDE.md`); cada cliente tiene su propia base.
- Categorías jerárquicas (`parent_id`) — no existe ese caso de uso en la UI actual.
- Relación muchos-a-muchos entre productos y categorías — cada producto tiene una sola categoría, tal como ya modela el código.
- Tablas separadas para redes sociales y links del footer — resueltas como `jsonb` (sección 4.5).
- Tabla para la navegación principal (`mainNav`) — sigue siendo config de código; nadie pidió un editor de menú y es información que casi no cambia.
- Variantes de producto (talle/color con stock independiente), multi-moneda, multi-depósito, multi-vendedor, cupones con reglas complejas, reviews con fotos, wishlist, suscripciones — nada de esto existe hoy en la UI ni fue pedido. Se documentan acá solo para dejar constancia de que se pensaron y se descartaron a propósito, no por omisión.

---

## 9. Equivalencia con los tipos TypeScript actuales

Para que quede explícito que este diseño no inventó nada por fuera del código real:

| Tipo TypeScript actual | Archivo | Tabla(s) equivalente(s) |
|---|---|---|
| `Product` | `config/products.ts` | `products` + `product_images` |
| `Category` | `config/categories.ts` | `categories` |
| `CartLineItem` | `store/cart-store.ts` | No persiste (vive en memoria); se convierte en filas de `order_items` recién al confirmar el pedido |
| `CheckoutFormValues` | `lib/checkout.ts` | Campos de contacto → `customers`; resto (entrega, pago, notas, lat/lng) → `orders` |
| `Testimonial` | `config/testimonials.ts` | `testimonials` |
| `Benefit` | `config/benefits.ts` | `benefits` |
| `PromotionConfig` | `config/promotion.ts` | `banners` |
| `businessConfig` | `config/business.ts` | `business_settings` |
| `footerConfig` | `config/footer.ts` | `business_settings` (contacto + `social_links`/`footer_links` jsonb) |
| `OrderWhatsAppMessageParams` (mensaje armado) | `lib/whatsapp.ts` | `orders.whatsapp_message` (snapshot del texto ya generado) |

---

## 10. Fuera de alcance de este sprint (a propósito)

- Migraciones SQL (`supabase/migrations/`).
- Políticas RLS escritas (solo se definió la estrategia, sección 6).
- Conexión real de `config/products.ts`/`config/categories.ts` a Supabase.
- Cualquier cambio de código, componente o página.
- El panel administrativo en sí.

Estos puntos ya están reflejados en el roadmap oficial (`CLAUDE.md`, sección 8) como pasos siguientes, ahora con un modelo de datos concreto detrás en vez de una intención abstracta.
