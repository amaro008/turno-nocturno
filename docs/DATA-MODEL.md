# DATA-MODEL — Entidades Supabase
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador
**Relacionado con:** ARCHITECTURE.md, AUTH-USERS.md, ADMIN.md, CASO-PILOTO.md

---

## Diagrama lógico
```
auth.users (Supabase)
   └─ 1—1 profiles
             └─ 1—N access_codes ──┐
             └─ 1—N sessions       ├── access_codes 1—1 sessions
             └─ 1—N admin_actions  │
                                   │
cases 1—N variants 1—N evidence_items
cases 1—N case_timeline
cases 1—N access_codes (código nace ligado a caso)

sessions 1—N chat_messages
sessions 1—N session_events
sessions 1—1 verdicts
```

## Tablas

### profiles (extiende auth.users)
- `id` uuid pk (= auth.users.id)
- `email` text (denormalizado de auth para queries admin)
- `full_name` text NOT NULL
- `birth_year` int NOT NULL
- `country` text NOT NULL, `city` text
- `role` text NOT NULL DEFAULT `'user'` — enum lógico: `user | admin`
- `is_vip` bool DEFAULT false — bandera para códigos gratis futuros
- `blocked_at` timestamptz nullable
- `accepted_terms_at` timestamptz NOT NULL
- `accepted_privacy_at` timestamptz NOT NULL
- `created_at`, `updated_at`

### cases
- `id` uuid pk, `slug` text unique, `title`, `synopsis`
- `city` text, `era_year` int, `era_profile` text (`vhs-80s`, ...)
- `time_limit_min` int DEFAULT 150
- `briefing_voice_path` text
- `active` bool DEFAULT true — permite ocultar del catálogo público sin borrar
- `price_mxn` int nullable — informativo en MVP (no hay pasarela); base para V1

### variants
- `id` uuid pk, `case_id` fk, `code` text (`A|B|C`)
- `active` bool DEFAULT true — solo participan en el sorteo si active
- `culprit` text — **jamás en prompts del chat**
- `solution_narrative`, `solution_voice_path`
- `commander_context` text
- `rubric` jsonb

### evidence_items
- `id` uuid pk, `code` text unique, `kind` (audio|video|document|hint)
- `scope` (shared|variant), `variant_id` nullable, `case_id` nullable
- `title`, `body_md`, `media_path`, `transcript`
- `unlocked_by` text[] (prerequisitos)
- `deliverable_from_minute` int DEFAULT 0
- `delivery` (chat_push|on_request|code_only)

### case_timeline
- `id` uuid pk, `case_id` fk, `minute` int
- `action` (message|voice|evidence|pressure|deadline)
- `payload` jsonb
- `variant_scope` text nullable
- UNIQUE(case_id, minute, action)

### access_codes  ← corazón del piloto
- `id` uuid pk
- `code` text unique — formato `TN-XXXX-XXXX`
- `user_id` fk profiles NOT NULL — código nace ligado a un usuario
- `case_id` fk cases NOT NULL
- `status` text — `draft | sent | redeemed | activated | in_progress | completed | expired`
- `created_at` timestamptz DEFAULT now()
- `sent_at` timestamptz nullable
- `redeemed_at` timestamptz nullable
- `activated_at` timestamptz nullable
- `completed_at` timestamptz nullable
- `expired_at` timestamptz nullable
- `created_by_admin` fk profiles — quién lo creó
- `admin_note` text nullable — contexto interno del admin
- `variant_id_used` fk variants nullable — variante sorteada cuando se activó

**Índices:** `(user_id, status)`, `(status, created_at)`, `code`

**Ventanas de expiración calculadas en `lib/engine/code-lifecycle.ts`:**
- Ventana de canje: `sent_at + 24h`
- Ventana total: `created_at + 5 days`
- Ventana de sesión: `activated_at + 24h` (si aplica)
- `effective_expires_at = MIN(vida total, ventana actual)`

### sessions
- `id` uuid pk
- `access_code_id` fk NOT NULL — 1:1 real con access_codes
- `user_id` fk NOT NULL (denormalizado para queries rápidas)
- `case_id` fk, `variant_id` fk NOT NULL (poblado al activar)
- `status` (created|activated|in_progress|verdict_submitted|resolved|expired)
- `created_at`, `activated_at`, `expires_at`
- `hints_used` int DEFAULT 0

### chat_messages
- `id` bigint pk, `session_id` fk, `at` timestamptz
- `role` (commander|players|system)
- `kind` (text|voice|evidence_card|system)
- `content` text, `voice_path` text nullable, `evidence_code` text nullable

### session_events
- `id` bigint pk, `session_id` fk, `at` timestamptz
- `type` (unlock|hint|timed_event_fired|guardrail_attempt|verdict_submitted|evidence_requested)
- `payload` jsonb
- Para eventos temporales: UNIQUE(session_id, type, (payload->>'timeline_id'))

### verdicts
- `session_id` pk/fk
- `accused`, `how_text`, `why_text`
- `culprit_correct` bool, `how_score`, `why_score`, `total_score` int
- `created_at`

### admin_actions  ← auditoría
- `id` bigint pk, `admin_id` fk profiles, `at` timestamptz
- `action` text (`code.create | code.send | code.revoke | code.regenerate |
  session.extend | session.cancel | user.block | user.edit | case.toggle_variant`)
- `entity_type` text, `entity_id` text, `payload` jsonb
- `ip` text, `user_agent` text

### data_deletion_requests
- `id`, `user_id` fk, `email`, `requested_at`, `processed_at` nullable, `notes`
- MVP: se procesa manualmente; V1 puede automatizarse

## Reglas de integridad clave
1. Al activar: `variant_id = random(SELECT id FROM variants WHERE case_id = X AND active)`
2. `enviar_evidencia(code)` valida contra BD (variante ∈ {shared, sorteada} + minuto + prereqs)
3. Eventos temporales: UNIQUE previene doble ejecución
4. `chat_messages.role='commander'` con `kind='evidence_card'` implica `session_events` con `type='unlock'`
5. Trigger o job diario: `access_codes` con `effective_expires_at < now()` → status `expired`

## RLS (Row Level Security)
Habilitada en todas las tablas de usuario. Políticas base:
- `profiles`: usuario ve/edita solo su fila; admin ve/edita todas
- `access_codes`: usuario ve solo las suyas; admin ve todas
- `sessions`, `chat_messages`, `session_events`, `verdicts`: usuario ve solo las de sus sesiones;
  admin ve todas
- `cases`, `variants` (metadatos): lectura pública para `active=true`; escritura solo admin
- `evidence_items`: lectura solo desde API server-side (nunca directo desde cliente)
- `admin_actions`: solo admin escribe/lee

## Migrations (`supabase/migrations/`)
Orden: `0001_auth_and_profiles → 0002_cases_variants_evidence → 0003_case_timeline →
0004_access_codes → 0005_sessions_and_events → 0006_chat_messages → 0007_verdicts →
0008_admin_actions_audit`
