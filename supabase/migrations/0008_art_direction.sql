-- ============================================================================
-- 0008 — Dirección de arte por caso (Iteración 3, Fase 3)
--  * cases: dirección de arte + prompts de portada/hero + toggle de inyección
--  * suspects: descripción física, rasgos distintivos y prompt de imagen
--  * case_visual_prompts: prompts de assets adicionales (escena, VHS, evidencia)
-- ============================================================================

alter table cases add column if not exists art_direction text not null default '';
alter table cases add column if not exists cover_image_prompt text not null default '';
alter table cases add column if not exists hero_image_prompt text not null default '';
alter table cases add column if not exists art_autoinject boolean not null default true;

alter table suspects add column if not exists physical_description text not null default '';
alter table suspects add column if not exists distinctive_features text not null default '';
alter table suspects add column if not exists image_prompt text not null default '';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'visual_media_kind') then
    create type visual_media_kind as enum ('image', 'video');
  end if;
  if not exists (select 1 from pg_type where typname = 'visual_status') then
    create type visual_status as enum ('pending', 'generated', 'approved');
  end if;
end $$;

create table if not exists case_visual_prompts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  variant_id uuid references variants(id) on delete set null,
  slot_name text not null,
  media_kind visual_media_kind not null default 'image',
  prompt text not null default '',
  negative_prompt text not null default '',
  technical_params jsonb not null default '{}'::jsonb,
  reference_notes text not null default '',
  generated_asset_path text,
  status visual_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (case_id, slot_name)
);
create index if not exists idx_visual_prompts_case on case_visual_prompts(case_id);

-- Solo servidor (service role): contiene material de autoría (no expone la solución
-- al cliente). RLS habilitado sin políticas de cliente.
alter table case_visual_prompts enable row level security;
