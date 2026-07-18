# USER-FLOWS — Flujos críticos
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador
**Relacionado con:** PRD.md, AUTH-USERS.md, ADMIN.md, DATA-MODEL.md

---

## Flujo P — Descubrimiento público (Fase 2)
Páginas públicas sin autenticación, con identidad visual e imágenes.
1. **Home (`/`)** — hero con imagen atmosférica + tagline "Reabre casos. Interroga
   sospechosos. Encuentra al culpable antes que el reloj llegue a cero." CTA "Ver casos" /
   "Cómo funciona". Secciones: cómo funciona (3 pasos ilustrados), casos disponibles
   (jala de `cases WHERE active`), testimonios, footer con legales/redes/contacto.
2. **Catálogo (`/casos`)** — grid de casos activos con portada, ciudad+año, dificultad y
   precio de referencia. Filtros por ciudad, época y dificultad. "Ver detalles".
3. **Detalle (`/casos/[slug]`)** — hero con portada, `marketing_synopsis` (sin spoilers),
   ficha (ciudad, año, duración, jugadores 2–6, dificultad, precio), "Qué necesitas", y CTA:
   - No autenticado → **"Comprar caso"** lleva a `/registro`.
   - Autenticado → **"Pedir mi código por WhatsApp"** (en MVP los códigos se entregan a mano).
   - NUNCA muestra sospechosos ni evidencia (anti-spoiler): los datos sensibles no salen del servidor.
4. **Cómo funciona (`/como-funciona`)** — explicación larga con imágenes, demo del chat del
   Comandante y FAQ en acordeón.

> Imágenes: en el piloto se usan placeholders (Unsplash con respaldo garantizado). El admin
> puede subir portada (`cover_image_path`) y atmósfera (`atmosphere_image_path`) por caso;
> se sirven con URL firmada del bucket privado `media`.

## Flujo 0 — Admin genera y envía código (arranca el ciclo comercial)
1. Cesar recibe transferencia offline (SPEI, efectivo)
2. Entra a `/admin/codigos/nuevo`
3. Selecciona usuario (búsqueda por email; si el usuario no existe, le pide que primero se
   registre — decisión de diseño: no crear usuarios "fantasma" desde admin en MVP)
4. Selecciona caso, agrega nota interna ("SPEI 12/jul, ref 448291")
5. Click "Guardar y enviar email"
6. Backend: crea `access_codes` con status `sent`, `created_at = now()`, `sent_at = now()`
7. Resend envía email al usuario con el código y botón "Canjear"
8. Registro en `admin_actions`

## Flujo 1 — Usuario se registra
1. Landing → click "Registrarse"
2. Formulario: nombre, email, password, año de nacimiento, país, ciudad (opcional)
3. Dos checkboxes: acepto términos + acepto aviso de privacidad
4. Submit → Supabase Auth crea usuario + trigger crea `profiles` con datos
5. Email de verificación → usuario da click → `/auth/callback` marca email verificado
6. Redirige a `/mi-biblioteca` (vacía si no ha canjeado nada)

## Flujo 2 — Usuario canjea código
1. Recibe email con código `TN-BUHO-4471` y botón "Canjear ahora"
2. Click → si no está logueado, login primero → llega a `/mi-biblioteca/canjear` con código pre-llenado
3. Backend valida:
   - Existe, status = `sent`, `user_id` corresponde al usuario logueado
   - `sent_at + 24h > now()` (ventana de canje viva)
   - `created_at + 5d > now()` (vida total viva)
4. Si válido: status → `redeemed`, `redeemed_at = now()`
5. Redirige a biblioteca; tarjeta del caso aparece con "Preparar sesión" y countdown de vida útil
6. Si inválido: mensaje claro (código incorrecto / expirado / no es tuyo)

## Flujo 3 — Hoja de misión y arranque del turno (Refactor F3)
El reloj **no** arranca al salir de la biblioteca. Hay un paso de preparación con una hoja de
misión clara (reemplaza al briefing anterior; `/s/[code]/briefing` redirige a `/s/[code]/mision`).
1. En biblioteca, click **"Preparar sesión"** → redirige a **`/s/[code]/mision`**.
   > Aquí NO se crea la sesión ni se sortea variante ni corre el reloj.
2. La **hoja de misión** muestra, en estética de expediente noir (todo desde el servidor, sin
   exponer la solución), en secciones verticales con scroll natural:
   - **Encabezado**: título, ciudad + época, imagen atmosférica, sello rojo "MISIÓN".
   - **La situación**: sinopsis técnica (el gancho), sin spoilers.
   - **Su misión**: los 3 objetivos (QUIÉN / CÓMO / POR QUÉ) — "los tres cierran el caso".
   - **Lo que van a tener**: N sospechosos + conteo de evidencia INICIAL por tipo (documentos,
     fotos, audios, videos, testimonios, registros) + cuaderno de notas + Comandante para dudas.
   - **Cómo trabajar el caso** (bloque destacado): material base abierto desde el inicio; el
     Comandante NO entrega evidencia bajo demanda (solo dudas); contacto cada 20–30 min; 3 pistas
     (restan puntaje); "Cerrar el caso" cuando estén listos.
   - **El reloj**: duración total; a cero, veredicto inmediato, sin pausa.
   - **Recomendaciones**: pantalla compartida, todos presentes, alguien tomando notas, ambiente.
3. Botón grande **"Iniciar Turno Nocturno"** (rojo confidencial) → **modal de confirmación** con
   último aviso ("una vez que inicien, el reloj no se detiene… ¿están todos listos?") + "Sí,
   iniciar". Botón secundario "Regresar a mi biblioteca" (sin arrancar nada).
4. Al confirmar → `POST /api/sessions/activate { code, confirm:true }`:
   - `access_codes.status` `redeemed → activated`, `activated_at = now()`
   - **Sorteo de variante** entre `variants WHERE case_id = X AND active`
   - Crea `sessions` con `activated_at = now()`, `expires_at = activated_at + 24h`
5. Redirige a `/s/[code]` (el portal de juego). El reloj corre desde `activated_at`.

> Idempotente: si el código ya está `activated`/`in_progress`, tanto la hoja de misión como
> la API mandan directo al portal de juego sin recrear nada. La víctima (`is_victim`) no aparece
> en el conteo de sospechosos.

## Flujo 4 — Sesión de juego · consola rebalanceada (Refactor F4)
La consola pone el **Expediente como protagonista** (65%) y al **Comandante como columna
secundaria** (35%). Layout:
- **Barra superior:** caso + ciudad/época; **cronómetro grande H:MM:SS** con color por umbral
  (verde >60 min, ámbar 30–60, rojo <30); botón "Cerrar el caso".
- **Expediente (65%, primario)** — tabs por tipo, con contador de items disponibles:
  - **Reporte inicial** (abierto por default): el parte informativo (`evidence_items` con
    `is_report=true`, `type=document`, `initial=true`). Es lo primero que ven.
  - **Sospechosos**: grid de fichas con foto grande; modal con la ficha PÚBLICA (nunca variante);
    "Descartar" local (solo UI). La víctima no aparece.
  - **Documentos / Fotos / Audios / Videos / Testimonios / Registros**: cada tab con su visor
    (`DocumentViewer` markdown, `PhotoGallery` con lightbox, `AudioPlayer`, `VideoPlayer`,
    `TestimonyViewer` formato entrevista, registros en `DocumentViewer`). En cada tab, además de
    lo abierto, se muestran **placeholders bloqueados** ("Disponible más tarde…" + minuto estimado)
    sin spoilear qué son.
  - **Notas** (auto-guardado en `sessions.player_notes`) y **Códigos** (desbloqueo por código:
    el jugador escribe el código **sin sufijo de variante** —`CINTA-0158`, `NECRO`— y el backend
    resuelve `{code}-{variante}` de su sesión).
- **Comandante (35%, secundario)**: header con nombre y rol ("Comandante Vega — Fiscalía"), ayuda
  contextual ("pregúntame dudas… NO puedo entregarte pruebas que aún no aparecen"), historial
  compacto, input ("Escribe tu duda… (Enter para enviar)"), botón **"Pedir pista"** visible +
  contador **pistas N/3**, y toggle de **mute** del chime.
- **Barra inferior:** pips de pistas + "Cerrar el caso".

**Evidencia nueva** (liberada por evento temporal): **badge** en el tab + **toast** "Nueva
evidencia recibida: …" (click salta al tab) + **chime** discreto (con mute) + un mensaje breve
del Comandante en su chat ("peritajes entregó más material. Está en su expediente.").

Protección anti-descarga: URLs firmadas TTL 10 min, anti-selección/menú contextual, marca de
agua con código de sesión, `controlsList`/`disablePictureInPicture`, `referrer:no-referrer`.

**Anti-spoiler — el código interno de evidencia jamás se expone al cliente:** el `code` de
`evidence_items` lleva el sufijo de la variante (`…-A`/`-B`/`-C`), así que enviarlo al navegador
revelaría la variante sorteada y, con ella, al culpable. La UI **nunca** renderiza el `code`
(ni en tarjetas, visores, galería, testimonios ni toasts) y el payload de `/state` y `/evidence`
**no lo incluye**: solo `title` y `public_description` (más el contenido tipado de las piezas
abiertas) son visibles al jugador, referenciados por `id` opaco. Ver **ARCHITECTURE.md → Contrato
de payload al cliente**.

### Bucle principal
1. Al entrar, leen el **Reporte inicial** y el material base (todo lo `initial` está abierto).
2. Investigan el Expediente por tipo; descartan sospechosos localmente; toman notas.
3. Consultan al Comandante **dudas específicas** sobre lo que ya tienen. **Ya no entrega evidencia
   bajo demanda**: si se la piden, responde en personaje y redirige.
4. Cada ~20–30 min un evento temporal libera evidencia nueva (aparece en su tab) o mete presión.
5. Códigos impresos/descubiertos también desbloquean evidencia (input en Expediente).
6. Pistas (máx 3), restan puntuación.

## Flujo 5 — Veredicto
1. Botón "Cerrar el caso" siempre visible
2. Formulario: quién / cómo / por qué
3. `POST /api/verdict/submit`:
   - Culpable vs BD (exacto)
   - Cómo/por qué → llamada aislada a Anthropic con rúbrica
4. Comandante reacciona en chat + nota de voz pregrabada de resolución de la variante
5. Pantalla de reconstrucción con timeline + puntuación
6. `access_codes.status` → `completed`; `sessions.status` → `resolved`
7. En biblioteca la tarjeta pasa a "Sesión jugada" (readonly, con veredicto)

## Flujo 6 — Reanudación tras recarga
1. Cliente monta `/s/[code]` → `GET /api/sessions/[id]/state`
2. Servidor devuelve historial de `chat_messages`, evidencias desbloqueadas, tiempo, pistas
3. UI hidrata chat + Expediente igual
4. Eventos temporales vencidos no ejecutados se disparan

## Flujo 7 — Admin monitorea sesión en vivo
1. En `/admin/sesiones` ve lista con "activas" arriba
2. Click en una → `/admin/sesiones/[id]`
3. Timeline de `session_events` con auto-refresh cada 15 s
4. Puede leer el chat en vivo, ver qué evidencia han abierto
5. Acción excepcional: extender tiempo (con justificación → `admin_actions`)

## Flujo 8 — Admin reenvía o regenera código
1. En `/admin/codigos` filtra por status `sent`
2. Usuario reporta "no me llegó" → click "Reenviar email" → registro en `admin_actions`
3. Si el código venció por descuido de Cesar (no llegó a enviar) → "Regenerar":
   se marca el anterior como `expired`, se crea nuevo con nuevo `code` y `sent_at`,
   se envía email automático

## Estados de sesión (BD)
`created → activated → in_progress → verdict_submitted → resolved | expired`

## Estados de código (BD)
`draft → sent → redeemed → activated → in_progress → completed | expired`
