# Supabase — Base de datos de Turno Nocturno

## Orden de ejecución

En el **SQL Editor** de tu proyecto Supabase, corre en este orden:

1. `migrations/0001_initial_schema.sql` — tablas base, enums, índices
2. `migrations/0002_timeline_chat_events.sql` — timeline, chat, eventos, auditoría
3. `migrations/0003_auth_trigger_rls.sql` — trigger de perfil + Row Level Security
4. `seed.sql` — Caso 001 "La Última Transmisión" (variantes A y B)

> También puedes usar la CLI: `supabase db push` (con el proyecto vinculado).

## Después del seed: crea tu usuario admin

1. Regístrate en la app con tu email real (flujo normal de `/registro`).
2. En el SQL Editor, promueve tu cuenta a admin:

```sql
update profiles set role = 'admin' where email = 'TU_EMAIL@ejemplo.com';
```

## Storage (media de evidencia — opcional en MVP)

Crea un bucket **privado** llamado `evidence`. Los `media_path` del seed van en
`null`, así que el juego funciona solo con texto/transcripciones hasta que subas
audios y videos. Cuando los subas, actualiza `evidence_items.media_path` con la
ruta dentro del bucket; el servidor firma URLs con TTL de 2 h.

## Seguridad (resumen)

- `variants` (con `culprit`), `evidence_items` y `case_timeline` **no tienen
  políticas de lectura para el cliente**: solo el service role (servidor) las ve.
  Por eso el culpable nunca llega al navegador.
- El usuario solo puede leer sus propios `access_codes`, `sessions`, `chat_messages`.
- El catálogo (`cases` activos) es público.
- Toda la lógica del juego escribe con service role desde las API routes.
