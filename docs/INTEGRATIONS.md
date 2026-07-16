# INTEGRATIONS — APIs externas y costos
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador
**Relacionado con:** ARCHITECTURE.md

---

## 1. Supabase (BD + Auth + Storage + Realtime)
- **Auth:** email + password con verificación por email; password reset; row-level policies
- **Postgres:** todas las tablas del sistema
- **Storage:** buckets privados para media (audio/video/documentos)
- **Realtime:** activo en `chat_messages` y `session_events` para V1 multi-dispositivo
- Free tier suficiente para piloto; upgrade a Pro cuando pasemos ~500 MAU
- Clients: `lib/server/supabase.ts` (service key) y `lib/server/supabase-user.ts` (JWT usuario, respeta RLS)

## 2. Anthropic API (runtime — Comandante)
- claude-sonnet, streaming SSE
- Uso 1: chat (system con contexto de variante, sin culprit)
- Uso 2: tool `enviar_evidencia` validada en backend
- Uso 3: evaluación de veredicto (llamada aislada, sin historial de chat)
- Costo: $0.50-1.50 USD por sesión

## 3. ElevenLabs
- Autoría: voces por personaje adaptadas a la época + voz del Comandante (fija)
- Runtime: TTS streaming del Comandante para respuestas relevantes
- Regla dramática: voz en momentos de peso; texto para lo cotidiano
- Fallback: si TTS falla, degradar a texto
- Costo runtime: $0.30-1.00 USD por sesión

## 4. Video generación (autoría)
- Kling recomendado; Veo 3.1 Fast para tomas premium
- 4-6 clips por caso ≈ $5-15 USD
- Post-fx ffmpeg por perfil de época (`cases.era_profile`)

## 5. Resend (email transaccional)
- Dominio propio `turnonocturno.app` con SPF + DKIM verificados
- Plantillas en React Email (`lib/emails/`)
- Solo transaccionales en MVP (código, reenvío, regeneración)
- Marketing/newsletters queda para V1
- Free tier: 3,000 emails/mes — sobra para piloto

## 6. Vercel + GitHub
- Repo `turno-nocturno` → deploy automático
- Preview deployments por PR
- Vercel Cron Jobs para expirar códigos (opcional en MVP, obligatorio en V1)
- Environment Variables para todas las claves

## Variables de entorno (`.env.example`)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# APIs de IA (runtime)
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_COMMANDER_VOICE_ID=

# Email
RESEND_API_KEY=
RESEND_FROM_ADDRESS=Turno Nocturno <hola@turnonocturno.app>

# App
NEXT_PUBLIC_APP_URL=https://turnonocturno.app

# Solo pipeline de autoría (NO se despliegan a Vercel)
KLING_API_KEY=
VEO_API_KEY=
```

## Presupuesto piloto total: $30-50 USD (medios + APIs runtime)
