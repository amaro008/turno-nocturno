-- ============================================================================
-- 0007 — Biblioteca de assets del sitio (Iteración 3, Fase 1)
-- CMS ligero: imágenes del landing/marketing editables desde el admin por "slot".
-- El versionado es implícito (nunca se sobrescribe el archivo; se apunta al nuevo
-- path en Storage). Lectura pública (imágenes de marketing, no sensibles).
-- ============================================================================

create table if not exists site_assets (
  id uuid primary key default gen_random_uuid(),
  slot text unique not null,
  title text not null default '',
  description text not null default '',
  image_path text,
  alt_text text not null default '',
  updated_by_admin uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table site_assets enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'site_assets' and policyname = 'site_assets_public_read') then
    create policy site_assets_public_read on site_assets for select using (true);
  end if;
end $$;

-- ---- Seed de los slots que existen hoy en el landing ----
insert into site_assets (slot, title, description, alt_text) values
  ('landing.hero', 'Hero principal del landing', 'Imagen atmosférica de fondo del hero en la página de inicio (/).', 'Escena nocturna de investigación'),
  ('landing.how_step_1', 'Cómo funciona · Paso 1', 'Ilustración del paso "Crea tu cuenta" en el home.', 'Crear cuenta'),
  ('landing.how_step_2', 'Cómo funciona · Paso 2', 'Ilustración del paso "Recibe tu código" en el home.', 'Recibir código'),
  ('landing.how_step_3', 'Cómo funciona · Paso 3', 'Ilustración del paso "Juega en grupo" en el home.', 'Jugar en grupo'),
  ('landing.testimonial_1_avatar', 'Testimonio 1 · Avatar', 'Foto/avatar del primer testimonio en el home.', 'Avatar de testimonio'),
  ('landing.testimonial_2_avatar', 'Testimonio 2 · Avatar', 'Foto/avatar del segundo testimonio en el home.', 'Avatar de testimonio'),
  ('landing.testimonial_3_avatar', 'Testimonio 3 · Avatar', 'Foto/avatar del tercer testimonio en el home.', 'Avatar de testimonio'),
  ('como_funciona.hero', 'Cómo funciona · Imagen superior', 'Imagen del encabezado en la página /como-funciona.', 'Tablero de investigación'),
  ('catalog.empty_state', 'Catálogo · Estado vacío', 'Ilustración cuando no hay casos con los filtros aplicados.', 'Sin resultados')
on conflict (slot) do nothing;
