-- ============================================================================
-- 0001 — Esquema inicial: perfiles, casos, variantes, evidencia, sesiones,
--        veredictos. (Timeline y chat en migraciones siguientes.)
-- ============================================================================

-- ---- Enums ----
create type user_role as enum ('user', 'admin');
create type evidence_kind as enum ('audio', 'video', 'document', 'hint');
create type evidence_scope as enum ('shared', 'variant');
create type evidence_delivery as enum ('chat_push', 'on_request', 'code_only');
create type session_status as enum (
  'created', 'activated', 'in_progress', 'verdict_submitted', 'resolved', 'expired'
);
create type access_code_status as enum (
  'draft', 'sent', 'redeemed', 'activated', 'in_progress', 'completed', 'expired'
);
create type verdict_score as enum ('correcto', 'parcial', 'incorrecto');

-- ---- profiles (1—1 con auth.users) ----
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  birth_year int,
  country text,
  city text,
  role user_role not null default 'user',
  is_vip boolean not null default false,
  is_blocked boolean not null default false,
  accepted_terms_at timestamptz,
  accepted_privacy_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---- cases ----
create table cases (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  synopsis text not null default '',
  city text not null,
  era_year int not null,
  era_profile text not null default 'default',
  time_limit_min int not null default 150,
  briefing_voice_path text,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---- variants (culprit jamás sale al cliente vía RLS) ----
create table variants (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  code text not null,                    -- 'A' | 'B' | 'C'
  active boolean not null default true,
  culprit text not null,
  solution_narrative text not null default '',
  solution_voice_path text,
  commander_context text not null default '',
  rubric jsonb not null default '{}'::jsonb,
  unique (case_id, code)
);

-- ---- evidence_items ----
create table evidence_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  variant_id uuid references variants(id) on delete cascade,
  code text not null,
  kind evidence_kind not null,
  scope evidence_scope not null,
  title text not null,
  body_md text,
  media_path text,
  transcript text,
  unlocked_by text[] not null default '{}',
  deliverable_from_minute int not null default 0,
  delivery evidence_delivery not null default 'on_request',
  unique (case_id, code)
);

-- ---- access_codes ----
create table access_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  user_id uuid not null references profiles(id) on delete cascade,
  case_id uuid not null references cases(id) on delete restrict,
  status access_code_status not null default 'draft',
  note text,
  session_id uuid,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  redeemed_at timestamptz,
  activated_at timestamptz,
  completed_at timestamptz
);

-- ---- sessions ----
create table sessions (
  id uuid primary key default gen_random_uuid(),
  access_code_id uuid not null references access_codes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  case_id uuid not null references cases(id) on delete restrict,
  variant_id uuid references variants(id) on delete set null,
  status session_status not null default 'activated',
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  expires_at timestamptz,
  hints_used int not null default 0
);

alter table access_codes
  add constraint access_codes_session_fk
  foreign key (session_id) references sessions(id) on delete set null;

-- ---- verdicts ----
create table verdicts (
  session_id uuid primary key references sessions(id) on delete cascade,
  accused text not null,
  how_text text not null default '',
  why_text text not null default '',
  culprit_correct boolean not null,
  how_score verdict_score not null,
  why_score verdict_score not null,
  total_score int not null,
  created_at timestamptz not null default now()
);

-- ---- índices ----
create index idx_access_codes_user on access_codes(user_id);
create index idx_access_codes_status on access_codes(status);
create index idx_sessions_user on sessions(user_id);
create index idx_sessions_status on sessions(status);
create index idx_evidence_case on evidence_items(case_id);
create index idx_variants_case on variants(case_id);
