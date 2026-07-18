# ARCHITECTURE — Decisiones técnicas
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador
**Relacionado con:** PRD.md, PROJECT-STRUCTURE.md, AUTH-USERS.md, ADMIN.md, DATA-MODEL.md

---

## Infraestructura
GitHub (`turno-nocturno`, monorepo simple) → Vercel (Next.js 14 App Router + API Routes)
→ Supabase (Auth + Postgres + Storage + Realtime preparado). Resend para email transaccional.

## Stack elegido
| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | Next.js 14 App Router | SSR + streaming SSE + middleware de auth |
| Lenguaje | TypeScript estricto | Contratos compartidos cliente/servidor |
| UI base | Tailwind CSS | Velocidad + tema personalizable por era |
| Componentes | shadcn/ui | Table, Dialog, Sheet, Form — necesarios para admin |
| Animaciones | Framer Motion | Chat vivo (burbujas, typing, notas de voz) |
| Iconos | Lucide React | Ligero, consistente con shadcn |
| Formularios | react-hook-form + Zod | Validación robusta en registro y admin |
| Auth | Supabase Auth | Password reset + verificación + roles listos |
| BD | Supabase Postgres | Auth-linked, RLS, Realtime |
| Media storage | Supabase Storage | URLs firmadas |
| Email | Resend | Dominio propio, plantillas React Email |
| Realtime (V1) | Supabase Realtime | Preparado desde ya |
| Autoría | Python + ffmpeg | Ecosistema robusto para pipeline offline |
| Package manager | pnpm | Rápido en Vercel |
| Tests | Vitest | Config mínima |

## Los dos pipelines (invariante)

### Pipeline A — AUTORÍA (offline, `tools/autoria/`)
YAML del caso → `gen_audios.py` (ElevenLabs) → `gen_videos.py` (Kling/Veo) →
`post_fx.py` (ffmpeg por perfil de época) → `publish.py` (Supabase Storage + upsert).

### Pipeline B — SESIÓN + PLATAFORMA (runtime)
Ahora incluye tres experiencias con la misma app:

**B.1 Público:** landing, catálogo, registro, login, biblioteca, canje
**B.2 Sesión:** chat + expediente + veredicto (el corazón experiencial)
**B.3 Admin:** dashboard + gestión de usuarios/casos/códigos/sesiones

Todas comparten el mismo `lib/engine/`, mismo `lib/domain/`, mismo cliente de Supabase.
La separación es solo de rutas y middleware.

## Autenticación y autorización
- **Auth:** Supabase Auth (email + password + verificación)
- **Sesión de app:** cookie httpOnly con JWT de Supabase; leída server-side en cada route
- **Middleware raíz (`middleware.ts`):** protege `/mi-biblioteca/*`, `/s/*`, `/admin/*`
- **Middleware admin:** dentro de `/api/admin/*`, además del middleware raíz, cada route
  llama `assertAdmin(userId)` que consulta `profiles.role`
- **Regla clave:** las rutas admin verifican rol tanto en middleware como en la API. Doble
  check. Nada de "el frontend no muestra el botón" como única defensa.

## Comandante — arquitectura (Refactor F1)
- Texto: Anthropic streaming por `/api/chat/stream`. El system prompt se arma en
  `lib/server/prompts/commander.build.ts` a partir de `getCommanderData(ctx)` (`lib/server/game.ts`).
- **Contexto AUTORIZADO** que recibe el modelo:
  - Meta del caso + `variants.commander_context` (verdad de la variante, sin nombrar al culpable).
  - Ficha **pública** de cada sospechoso (lo mismo que ve el jugador).
  - `suspect_variant_data` de la variante sorteada: `alibi_declared`, `motive_apparent`,
    `variant_specific_notes` — para responder dudas sobre coartadas/móviles.
  - Lista **completa** de evidencia visible con su `public_description` y flag ABIERTA/NO ABIERTA
    (sabe qué existe y qué no puede revelar todavía).
  - Contenido completo **solo** de las evidencias ya abiertas.
- **Nunca** recibe: `is_culprit_in_variant`, `variants.culprit`/`culprit_suspect_id`/
  `solution_narrative`, `evidence_items.admin_notes`, ni el contenido de evidencia no abierta.
  (Ver el encabezado de `commander.build.ts` con la lista explícita incluido/excluido.)
- Tool lógica `enviar_evidencia(code)` validada en backend (`canOpen`): visible a la variante +
  abierta por initial/minuto/evento. Reparto principal: evidencia **inicial abierta desde el
  minuto 0** + eventos guionados del `case_timeline`.
- Voz: pregrabada (eventos) + generada (respuestas relevantes) con misma voz de marca.
- Evaluación de veredicto en llamada aislada, sin historial del chat.

## Motor de eventos temporales
- Tabla `case_timeline`, scheduler cliente hace polling a `/api/sessions/[id]/tick`
- Idempotente por `UNIQUE(session_id, timeline_id)` en `session_events`
- Cuenta regresiva contra `sessions.activated_at` server-side

## Ciclo de vida del código
- Toda la lógica de estados y expiración en `lib/engine/code-lifecycle.ts` (puro TS)
- Job de expiración: cron de Vercel (una vez al día, 02:00 UTC) que marca códigos vencidos
  como `expired`. En MVP puede correr manualmente si el cron no es necesario aún.
- Cálculo de `effective_expires_at` documentado en AUTH-USERS.md

## Emails transaccionales
- Resend + dominio propio (`turnonocturno.app` con SPF/DKIM verificados)
- Plantillas en React Email (`lib/emails/*.tsx`) para consistencia con el resto del stack
- Solo tres plantillas en MVP: código nuevo, código reenviado, código regenerado
- Envío desde API routes con retry simple (Resend maneja bounce/complaint dashboard)

## Preparación para multi-dispositivo (V1)
- Todo estado en Supabase, no en memoria del cliente (regla no negociable)
- `RealtimeProvider` sembrado vacío en `app/s/[code]/_providers/`
- `chat_messages` y `session_events` particionan naturalmente por `session_id`

## Guardarraíles
1. Prompt del chat no incluye `culprit` ni `solution_narrative`
2. `lib/server/guardrails.ts` anota intentos de extracción en `session_events`
3. `enviar_evidencia` gated por BD (variante + minuto + prereqs)
4. Personaje del Comandante ante presión
5. Rutas admin: doble verificación de rol
6. Rate limits en endpoints públicos sensibles (`/api/auth/*`, `/api/codes/redeem`)

## Deployment
- `main` → producción en Vercel
- Cada PR → preview deployment con BD y storage aislados (branch Supabase en V1;
  en MVP compartimos BD dev entre previews)
- Secretos en Vercel Environment Variables; nunca en el repo
