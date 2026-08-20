-- ============================================================
-- home_content -- Contenido editorial de la Home (fila única, id = 1)
-- ============================================================
--
-- Por qué una tabla nueva y no más columnas en business_settings:
-- business_settings es la IDENTIDAD del negocio (nombre, WhatsApp,
-- contacto, redes, moneda, mapa, colores). Esto es el CONTENIDO
-- COMERCIAL de la Home (barra de anuncios, hero, ofertas, bloque
-- mayorista, garantías) -- cambia con cada campaña, no con la identidad,
-- y lo administra una pantalla distinta (/admin/contenido). Mezclarlos
-- habría hecho que un solo formulario gigante controlara dos cosas que
-- se editan con frecuencias muy distintas.
--
-- Por qué jsonb para anuncios y garantías, en vez de dos tablas hijas:
-- son listas cortas y fijas (2-5 elementos), sin relaciones hacia
-- ninguna otra tabla, sin orden que se consulte por separado, y se
-- guardan siempre juntas en el mismo submit del formulario. Dos tablas
-- con su propio CRUD habrían sido sobreingeniería para eso (CLAUDE.md
-- sección 6, principio 6). Si alguna vez necesitan vida propia
-- (activar/desactivar por separado, programar por fecha), la migración
-- a tablas reales es directa.

create table if not exists public.home_content (
  id smallint primary key default 1,

  -- Barra de anuncios (strip superior, rota entre mensajes)
  announcement_enabled boolean not null default true,
  announcement_messages jsonb not null default '[]'::jsonb,

  -- Hero
  hero_eyebrow text,
  hero_title text,
  hero_subtitle text,
  hero_badge text,

  -- Sección de Ofertas
  offers_enabled boolean not null default true,
  offers_eyebrow text,
  offers_title text,
  offers_subtitle text,

  -- Bloque Mayorista (el CTA al grupo de WhatsApp)
  wholesale_enabled boolean not null default true,
  wholesale_eyebrow text,
  wholesale_title text,
  wholesale_subtitle text,
  -- Link del grupo de WhatsApp (chat.whatsapp.com/...). Cuando está
  -- vacío, el botón cae automáticamente al chat directo del negocio con
  -- `wholesale_whatsapp_message` -- nunca queda un botón roto.
  wholesale_group_url text,
  wholesale_cta_label text,
  wholesale_whatsapp_message text,
  wholesale_benefits jsonb not null default '[]'::jsonb,

  -- Garantías (reemplazan a los testimonios del template)
  guarantees_enabled boolean not null default true,
  guarantees_eyebrow text,
  guarantees_title text,
  guarantees_subtitle text,
  guarantees jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Garantiza la fila única, igual que business_settings
  constraint home_content_singleton check (id = 1)
);

-- Mismo trigger compartido de updated_at que el resto del esquema
drop trigger if exists set_home_content_updated_at on public.home_content;
create trigger set_home_content_updated_at
before update on public.home_content
for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: lectura pública (la Home la consume sin sesión), escritura solo
-- admins. Sin insert ni delete: la fila es fija, igual que
-- business_settings (Fase 8).
-- ============================================================
alter table public.home_content enable row level security;

drop policy if exists "home_content_public_read" on public.home_content;
create policy "home_content_public_read"
on public.home_content for select
to public
using (true);

drop policy if exists "home_content_admin_update" on public.home_content;
create policy "home_content_admin_update"
on public.home_content for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

