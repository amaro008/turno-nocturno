-- ============================================================================
-- 0002 — Timeline de eventos temporales, chat, eventos de sesión, auditoría
--        admin y solicitudes de borrado.
-- ============================================================================

create type timeline_action as enum ('message', 'voice', 'evidence', 'pressure', 'deadline');
create type chat_role as enum ('commander', 'players');
create type chat_kind as enum ('text', 'voice', 'evidence_card', 'system');
create type session_event_type as enum (
  'unlock', 'hint', 'timed_event_fired', 'guardrail_attempt', 'verdict_submitted', 'evidence_requested'
);

-- ---- case_timeline ----
create table case_timeline (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  minute int not null,
  action timeline_action not null,
  payload jsonb not null default '{}'::jsonb,
  variant_scope text,                     -- null = todas las variantes
  unique (case_id, minute, action)
);
create index idx_timeline_case on case_timeline(case_id, minute);

-- ---- chat_messages ----
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  at timestamptz not null default now(),
  role chat_role not null,
  kind chat_kind not null default 'text',
  content text not null default '',
  voice_path text,
  evidence_code text
);
create index idx_chat_session on chat_messages(session_id, at);

-- ---- session_events (telemetría + idempotencia de eventos temporales) ----
create table session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  at timestamptz not null default now(),
  type session_event_type not null,
  payload jsonb not null default '{}'::jsonb
);
create index idx_events_session on session_events(session_id, at);

-- Idempotencia de eventos temporales: un timeline_id se dispara una sola vez por sesión.
create unique index uniq_timed_event
  on session_events (session_id, (payload->>'timeline_id'))
  where type = 'timed_event_fired';

-- ---- admin_actions (auditoría) ----
create table admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id text,
  payload_json jsonb not null default '{}'::jsonb,
  ip text,
  at timestamptz not null default now()
);
create index idx_admin_actions_at on admin_actions(at desc);

-- ---- data_deletion_requests (LFPDPPP) ----
create table data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending',
  requested_at timestamptz not null default now()
);
