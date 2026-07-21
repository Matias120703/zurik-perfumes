-- Agrega `icon_name` a `categories`, pedida por el Sprint 5.4 (módulo de
-- administración de Categorías) y no contemplada en el diseño aprobado de
-- la Fase 8. Mismo patrón que `benefits.icon_name` (Fase 8): un identificador
-- de texto, nunca un componente de React -- se resuelve a un ícono de
-- lucide-react únicamente en la capa de presentación del panel
-- (components/admin/categories/category-icons.ts).
--
-- `not null default 'package'` (mismo criterio que `products.is_active` en
-- la Fase 10): las categorías ya sembradas quedan con el ícono genérico
-- por defecto en vez de null, sin romper ninguna fila existente.

alter table public.categories
  add column icon_name text not null default 'package';

comment on column public.categories.icon_name is 'Identificador de ícono de lucide-react (ej. "smartphone"), gestionado desde el panel (Sprint 5.4). Se resuelve a un componente únicamente en components/admin/categories/category-icons.ts -- nunca se guarda un componente de React en la base de datos.';
