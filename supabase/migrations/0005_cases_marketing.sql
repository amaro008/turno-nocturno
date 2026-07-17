-- ============================================================================
-- 0005 — Campos de marketing en `cases` (Fase 2)
--  * imágenes de portada y atmósfera (rutas en Storage `media`)
--  * sinopsis de marketing (sin spoilers, distinta del sinopsis técnico)
--  * dificultad + rango de jugadores recomendado
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'case_difficulty') then
    create type case_difficulty as enum ('facil', 'medio', 'dificil');
  end if;
end $$;

alter table cases add column if not exists cover_image_path text;
alter table cases add column if not exists atmosphere_image_path text;
alter table cases add column if not exists marketing_synopsis text;
alter table cases add column if not exists difficulty case_difficulty not null default 'medio';
alter table cases add column if not exists players_min int not null default 2;
alter table cases add column if not exists players_max int not null default 6;
