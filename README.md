# Turno Nocturno

Plataforma B2C de casos criminales con IA. Un grupo de amigos reabre un caso
archivado y lo resuelve en una sesión conducida por **el Comandante** (IA en vivo
por chat), con evidencia de época y culpable variable por sorteo.

> **Stack:** Next.js 14 (App Router) · Supabase (Auth + Postgres + Storage) ·
> Anthropic (Comandante) · Resend (email, opcional) · Vercel.
> Documentación de producto en [`/docs`](./docs).

Esta es la **primera versión funcional** (MVP v0.4): landing pública, registro/login,
biblioteca, canje de código, portal de sesión con streaming real del Comandante,
veredicto evaluado, y panel de administración de códigos.

---

## 1. Puesta en marcha local (5 pasos)

```bash
# 1. Instalar dependencias
npm install            # o pnpm install

# 2. Configurar variables de entorno
cp .env.example .env.local
#    → rellena los valores (ver sección 3)

# 3. Crear la base de datos en Supabase (ver sección 2)

# 4. Correr en local
npm run dev            # http://localhost:3000

# 5. Tests del motor (opcional)
npm test
```

---

## 2. Base de datos (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en orden los archivos de [`/supabase`](./supabase):
   1. `migrations/0001_initial_schema.sql`
   2. `migrations/0002_timeline_chat_events.sql`
   3. `migrations/0003_auth_trigger_rls.sql`
   4. `seed.sql`  ← carga el Caso 001 con variantes A y B
3. Crea tu **usuario admin**: regístrate en la app (`/registro`) y luego corre:
   ```sql
   update profiles set role = 'admin' where email = 'TU_EMAIL@ejemplo.com';
   ```
4. *(Opcional)* Crea un bucket **privado** llamado `evidence` para subir audios/videos.
   Sin medios, el juego corre con texto y transcripciones.

Detalle y modelo de seguridad en [`supabase/README.md`](./supabase/README.md).

---

## 3. Variables de entorno

Todas van en `.env.local` (local) y en **Vercel → Project Settings → Environment
Variables** (producción). Copia la plantilla desde [`.env.example`](./.env.example).

### Obligatorias

| Variable | Dónde se obtiene | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/publishable key | pública, segura para el navegador |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key | **SECRETA**, solo servidor |
| `ANTHROPIC_API_KEY` | console.anthropic.com | **SECRETA** |
| `NEXT_PUBLIC_SITE_URL` | — | `http://localhost:3000` en local; tu dominio en prod |

### Opcionales (con degradación elegante si faltan)

| Variable | Para qué | Si falta… |
|---|---|---|
| `ANTHROPIC_MODEL` | modelo del Comandante | usa `claude-sonnet-4-5` |
| `ANTHROPIC_EVAL_MODEL` | modelo evaluador del veredicto | usa el mismo del Comandante |
| `RESEND_API_KEY` | enviar códigos por email | el admin copia el código y lo envía a mano |
| `EMAIL_FROM` | remitente del email | `Turno Nocturno <no-reply@turnonocturno.app>` |
| `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` | notas de voz generadas | el Comandante responde solo en texto |

> El correo de Resend requiere dominio verificado (SPF + DKIM). Para el piloto puedes
> dejarlo vacío y enviar los códigos por WhatsApp desde el panel admin.

---

## 4. Despliegue en Vercel

1. Sube el repo a GitHub (`turno-nocturno`).
2. En [vercel.com](https://vercel.com) → **New Project** → importa el repo.
   Framework detectado: **Next.js**. No requiere configuración extra (`vercel.json` ya incluido).
3. Añade **todas** las variables de entorno de la sección 3 (Production + Preview).
4. En Supabase → **Authentication → URL Configuration**, agrega tu dominio de Vercel
   a *Site URL* y a *Redirect URLs* (`https://TU-DOMINIO/auth/callback`).
5. Deploy. Cada PR genera un **preview deployment** automático.

> `NEXT_PUBLIC_SITE_URL` debe apuntar a tu dominio de producción para que los links
> de email y los redirects de verificación funcionen.

---

## 5. Flujo completo de prueba

1. **Regístrate** en `/registro` (verifica el email si Supabase lo pide).
2. Hazte **admin** (SQL de la sección 2) y entra a `/admin`.
3. En **/admin/codigos/nuevo**, crea un código para tu propio usuario y el Caso 001.
4. Copia el código y **canjéalo** en `/mi-biblioteca`.
5. **Activa la sesión** → entra al portal, chatea con el Comandante, pídele evidencia,
   abre el Expediente y **cierra el caso** con tu veredicto.

---

## 6. Estructura del proyecto

```
app/                    Next.js App Router
  (marketing)/          landing pública
  (auth)/               registro, login (+ /auth/callback)
  mi-biblioteca/        dashboard del usuario, canje, activación
  s/[code]/             portal de sesión (chat + expediente + veredicto)
  admin/                panel de administración (dashboard + códigos)
  api/                  endpoints (chat SSE, sesiones, evidencia, veredicto)
lib/
  domain/               tipos y contratos
  engine/               motor puro y testeable (ciclo de código, timeline, gating, scoring)
  server/               clientes y lógica de servidor (Supabase, Anthropic, prompts, game)
  ui/                   utilidades de UI
supabase/               migraciones + seed + RLS
tests/                  tests del engine (Vitest)
docs/                   documentación de producto (v0.4)
```

## 7. Notas de la primera versión

- **Guardarraíles:** el prompt del Comandante nunca contiene el culpable; la evaluación
  del veredicto es una llamada aislada; `variants`/`evidence`/`timeline` no tienen RLS de
  cliente (solo el servidor los lee). El culpable jamás llega al navegador.
- **Sin medios aún:** las notas de voz del Comandante se muestran como texto/transcripción
  hasta que subas audios al bucket `evidence` y llenes `evidence_items.media_path`.
- **Multi-dispositivo (V1):** el estado ya vive en Supabase; falta activar Supabase Realtime.
- **Pendiente V1:** pasarela de pagos, módulos admin de usuarios/sesiones en vivo, variante C.
