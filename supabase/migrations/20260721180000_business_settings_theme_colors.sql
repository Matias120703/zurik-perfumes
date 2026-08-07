-- Habilita la sección "Colores del tema" de /admin/configuracion (hasta acá
-- marcada "Próximamente", Fase 25/Sprint 6.5): agrega los 3 colores de marca
-- administrables que faltaban en el diseño original de la Fase 8.
--
-- Mismo criterio que `tagline`/`logo_url`/etc. (Fase 14): columnas
-- nullable, la fila única de `business_settings` ya existe -- ninguna de
-- estas tres tenía valor antes de este cambio, y no hay un "default
-- razonable" para un color de marca. Mientras sea null, la tienda pública
-- sigue usando exactamente los mismos colores que ya tiene hoy (ver
-- `lib/theme.ts` -- solo se sobreescribe la variable CSS cuando el valor
-- no es null).
--
-- Formato validado a nivel de base (además de en el cliente,
-- `lib/theme.ts#isValidHexColor`) con un `check` de hexadecimal de 6
-- dígitos (#RRGGBB) -- mismo criterio que `promotions_discount_type_check`
-- (Fase 8): rechazar valores inválidos en el origen, no solo en el
-- formulario.
alter table public.business_settings
  add column primary_color text,
  add column secondary_color text,
  add column accent_color text;

alter table public.business_settings
  add constraint business_settings_primary_color_check
    check (primary_color is null or primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint business_settings_secondary_color_check
    check (secondary_color is null or secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint business_settings_accent_color_check
    check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.business_settings.primary_color is 'Color de marca principal (hex #RRGGBB), gestionado desde /admin/configuracion -> Apariencia -> Colores del tema. Null = la tienda sigue usando el color por defecto del template.';
comment on column public.business_settings.secondary_color is 'Color de marca secundario (hex #RRGGBB) -- fondos/superficies suaves. Null = valor por defecto del template.';
comment on column public.business_settings.accent_color is 'Color de botones/CTA (hex #RRGGBB) -- "Agregar al carrito", "Comprar", elementos interactivos destacados. Null = valor por defecto del template.';

-- Sin cambios de RLS: `business_settings_public_read` (lectura pública,
-- sin filtro) y `business_settings_admin_update` (solo is_admin()) ya
-- cubren estas columnas nuevas automáticamente -- RLS en Postgres es a
-- nivel de fila, no de columna, y ninguna de las dos policies existentes
-- necesita cambiar para que la tienda pueda leerlas y solo un admin pueda
-- escribirlas.
