-- Extiende `products` con dos columnas que pidió el Sprint 5.2 del Panel
-- Administrativo (módulo de Productos) y que no estaban en el diseño
-- aprobado de la Fase 8: `is_active` ("Estado Activo/Inactivo" en la
-- tabla y el formulario del panel) y `description` (el campo "Descripción
-- completa" del formulario, distinto de `short_description`, que ya
-- existía). Ninguna de las dos rompe datos existentes: `is_active`
-- default `true` dice que todo lo ya cargado sigue activo, `description`
-- nullable porque no todos los productos van a tener descripción larga.

alter table public.products
  add column is_active boolean not null default true,
  add column description text;

comment on column public.products.is_active is 'Estado Activo/Inactivo gestionado desde el panel (Sprint 5.2). No existía en el diseño original de la Fase 8.';
comment on column public.products.description is 'Descripción completa (distinta de short_description), gestionada desde el panel (Sprint 5.2).';

-- Mismo patrón que categories/banners/testimonials/benefits: público ve
-- solo activos, admin ve todo. products no tenía este split porque no
-- existía is_active hasta ahora.
create index products_active_idx on public.products (is_active) where is_active = true;

drop policy if exists "products_public_read" on public.products;

create policy "products_public_read_active"
on public.products for select
to public
using (is_active = true);

create policy "products_admin_read_all"
on public.products for select
to authenticated
using (public.is_admin());
