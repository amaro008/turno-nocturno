-- ============================================================================
-- 0004 — Gestión de casos desde el admin (Fase 1)
--  * tabla `suspects` (sospechosos compartidos por caso)
--  * `variants.culprit_suspect_id` (FK a suspects, además del texto `culprit`)
--  * `cases.price_ref_mxn` y `cases.validation_matrix` (matriz documental)
--  * bucket de Storage `media` (privado)
-- ============================================================================

-- ---- suspects ----
create table if not exists suspects (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  name text not null,
  age int,
  occupation text,
  relation text,               -- relación con la víctima
  description text,
  alibi text,                  -- coartada declarada
  photo_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_suspects_case on suspects(case_id, sort_order);

-- ---- variants: culpable como FK a suspects ----
alter table variants add column if not exists culprit_suspect_id uuid references suspects(id) on delete set null;

-- ---- cases: precio de referencia + matriz de validación (documental) ----
alter table cases add column if not exists price_ref_mxn int;
alter table cases add column if not exists validation_matrix jsonb not null default '{}'::jsonb;

-- ---- RLS de suspects (solo admin lee vía cliente; el juego los sirve por service role) ----
alter table suspects enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'suspects' and policyname = 'suspects_admin_select') then
    create policy suspects_admin_select on suspects for select using (public.is_admin());
  end if;
end $$;

-- ---- Bucket de Storage `media` (privado) ----
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;
