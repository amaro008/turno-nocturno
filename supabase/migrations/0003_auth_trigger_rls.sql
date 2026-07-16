-- ============================================================================
-- 0003 — Trigger de creación de perfil + Row Level Security.
--
-- Estrategia de seguridad:
--  * Los datos SENSIBLES del juego (variants.culprit, evidencia, timeline) NO
--    tienen políticas de lectura para el cliente → solo el service role los ve.
--  * El usuario puede leer únicamente SUS propios códigos/sesiones/chat.
--  * El catálogo público (cases activos) es legible por cualquiera.
--  * Toda escritura del juego pasa por API routes con service role (bypassa RLS).
-- ============================================================================

-- ---- Trigger: al crear un auth.user, crear su profile con la metadata ----
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, birth_year, country, city, accepted_terms_at, accepted_privacy_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'birth_year', '')::int,
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    case when new.raw_user_meta_data->>'accepted_terms' = 'true' then now() end,
    case when new.raw_user_meta_data->>'accepted_privacy' = 'true' then now() end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- Helper: ¿el usuario actual es admin? ----
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ---- Habilitar RLS en todas las tablas ----
alter table profiles enable row level security;
alter table cases enable row level security;
alter table variants enable row level security;
alter table evidence_items enable row level security;
alter table case_timeline enable row level security;
alter table access_codes enable row level security;
alter table sessions enable row level security;
alter table chat_messages enable row level security;
alter table session_events enable row level security;
alter table verdicts enable row level security;
alter table admin_actions enable row level security;
alter table data_deletion_requests enable row level security;

-- ---- profiles ----
create policy profiles_select_self on profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on profiles
  for update using (id = auth.uid() or public.is_admin());

-- ---- cases (catálogo público de casos activos; admin ve todo) ----
create policy cases_select_public on cases
  for select using (active = true or public.is_admin());

-- ---- access_codes (el usuario ve los suyos; admin ve todo) ----
create policy access_codes_select_own on access_codes
  for select using (user_id = auth.uid() or public.is_admin());

-- ---- sessions (el usuario ve las suyas; admin ve todo) ----
create policy sessions_select_own on sessions
  for select using (user_id = auth.uid() or public.is_admin());

-- ---- chat_messages / session_events / verdicts (via propiedad de la sesión) ----
create policy chat_select_own on chat_messages
  for select using (
    public.is_admin() or exists (
      select 1 from sessions s where s.id = chat_messages.session_id and s.user_id = auth.uid()
    )
  );
create policy events_select_own on session_events
  for select using (
    public.is_admin() or exists (
      select 1 from sessions s where s.id = session_events.session_id and s.user_id = auth.uid()
    )
  );
create policy verdicts_select_own on verdicts
  for select using (
    public.is_admin() or exists (
      select 1 from sessions s where s.id = verdicts.session_id and s.user_id = auth.uid()
    )
  );

-- ---- Solo-admin (lectura) para tablas operativas ----
create policy admin_actions_select on admin_actions
  for select using (public.is_admin());
create policy deletion_requests_select on data_deletion_requests
  for select using (user_id = auth.uid() or public.is_admin());
create policy deletion_requests_insert on data_deletion_requests
  for insert with check (user_id = auth.uid());

-- NOTA: variants, evidence_items y case_timeline NO tienen políticas de cliente
-- a propósito. Contienen la solución (culprit, narrativa, gating). Solo el
-- service role (servidor) puede leerlas. Así el culpable nunca llega al navegador.
