-- ============================================================================
-- 0009 — Modelo de datos limpio (refactor Fase 1)
-- 1) suspects: separar info pública de info de variante
--    - renombra name→full_name, relation→relationship_to_victim
--    - agrega accent_or_speech, typical_attire, internal_notes
--    - mueve description→internal_notes y alibi→suspect_variant_data
--    - nueva tabla suspect_variant_data (ADMIN-ONLY, jamás al cliente)
-- 2) evidence_items: base + tablas por tipo (document/photo/audio/video/
--    testimony/record). public_description es lo único que ve el cliente en el
--    listado; el contenido vive en las tablas por tipo.
-- ADVERTENCIA: elimina columnas viejas. El código nuevo debe desplegarse junto.
-- Rollback: supabase/migrations/0009_rollback.sql
-- ============================================================================

-- ------------------------------------------------------------------ enums ---
do $$ begin
  create type evidence_type as enum ('document','photo','audio','video','testimony','record');
exception when duplicate_object then null; end $$;

-- ============================================================ SUSPECTS =======
alter table suspects rename column name to full_name;
alter table suspects rename column relation to relationship_to_victim;

alter table suspects add column if not exists accent_or_speech text;
alter table suspects add column if not exists typical_attire text;
alter table suspects add column if not exists internal_notes text;

-- description (notas mezcladas del autor) → internal_notes
update suspects
   set internal_notes = trim(both E'\n' from concat_ws(E'\n', internal_notes, description))
 where description is not null and description <> '';

-- Nueva tabla admin-only con la data por variante -----------------------------
create table if not exists suspect_variant_data (
  id uuid primary key default gen_random_uuid(),
  suspect_id uuid not null references suspects(id) on delete cascade,
  variant_id uuid not null references variants(id) on delete cascade,
  alibi_declared text,
  motive_apparent text,
  variant_specific_notes text,
  is_culprit_in_variant boolean not null default false,
  created_at timestamptz not null default now(),
  unique (suspect_id, variant_id)
);
alter table suspect_variant_data enable row level security;
-- Sin políticas: solo el service role (servidor) puede leerla. Nunca el cliente.

-- Backfill genérico: una fila por (sospechoso × variante del mismo caso).
insert into suspect_variant_data (suspect_id, variant_id, alibi_declared, is_culprit_in_variant)
select s.id, v.id, s.alibi, (v.culprit_suspect_id = s.id)
from suspects s
join variants v on v.case_id = s.case_id
on conflict (suspect_id, variant_id) do nothing;

-- Ya migrados description/alibi: eliminar de la ficha pública.
alter table suspects drop column if exists description;
alter table suspects drop column if exists alibi;

-- ============================================================ EVIDENCE =======
alter table evidence_items add column if not exists type evidence_type;
alter table evidence_items add column if not exists initial boolean not null default false;
alter table evidence_items add column if not exists unlocked_at_minute int;
alter table evidence_items add column if not exists unlocked_by_event_id uuid
  references case_timeline(id) on delete set null;
alter table evidence_items add column if not exists public_description text not null default '';
alter table evidence_items add column if not exists admin_notes text not null default '';

-- Backfill desde el modelo viejo (kind/deliverable_from_minute/delivery).
update evidence_items set type = case kind
  when 'audio' then 'audio'::evidence_type
  when 'video' then 'video'::evidence_type
  else 'document'::evidence_type end
 where type is null;
update evidence_items set initial = (deliverable_from_minute = 0);
update evidence_items set unlocked_at_minute = nullif(deliverable_from_minute, 0);
update evidence_items set public_description = title where public_description = '';
alter table evidence_items alter column type set not null;

-- Tablas por tipo (contenido) -------------------------------------------------
create table if not exists evidence_document (
  evidence_id uuid primary key references evidence_items(id) on delete cascade,
  body_md text, image_path text, transcript text
);
create table if not exists evidence_photo (
  evidence_id uuid primary key references evidence_items(id) on delete cascade,
  image_path text, caption text, metadata jsonb not null default '{}'::jsonb
);
create table if not exists evidence_audio (
  evidence_id uuid primary key references evidence_items(id) on delete cascade,
  audio_path text, duration_seconds int, transcript text, speakers jsonb not null default '[]'::jsonb
);
create table if not exists evidence_video (
  evidence_id uuid primary key references evidence_items(id) on delete cascade,
  video_path text, duration_seconds int, transcript text,
  timestamps jsonb not null default '[]'::jsonb, frames_path text
);
create table if not exists evidence_testimony (
  evidence_id uuid primary key references evidence_items(id) on delete cascade,
  witness_name text, body_md text, audio_path text
);
create table if not exists evidence_record (
  evidence_id uuid primary key references evidence_items(id) on delete cascade,
  record_type text, body_md text, image_path text, structured_data jsonb not null default '{}'::jsonb
);

do $$ begin
  execute 'alter table evidence_document enable row level security';
  execute 'alter table evidence_photo enable row level security';
  execute 'alter table evidence_audio enable row level security';
  execute 'alter table evidence_video enable row level security';
  execute 'alter table evidence_testimony enable row level security';
  execute 'alter table evidence_record enable row level security';
end $$;

-- Migrar el contenido existente a su tabla por tipo.
insert into evidence_document (evidence_id, body_md, image_path, transcript)
select id, body_md, media_path, transcript from evidence_items where type = 'document'
on conflict (evidence_id) do nothing;
insert into evidence_audio (evidence_id, audio_path, transcript)
select id, media_path, transcript from evidence_items where type = 'audio'
on conflict (evidence_id) do nothing;
insert into evidence_video (evidence_id, video_path, transcript)
select id, media_path, transcript from evidence_items where type = 'video'
on conflict (evidence_id) do nothing;

-- Eliminar columnas del modelo viejo.
alter table evidence_items drop column if exists kind;
alter table evidence_items drop column if exists body_md;
alter table evidence_items drop column if exists media_path;
alter table evidence_items drop column if exists transcript;
alter table evidence_items drop column if exists deliverable_from_minute;
alter table evidence_items drop column if exists delivery;
alter table evidence_items drop column if exists unlocked_by;
