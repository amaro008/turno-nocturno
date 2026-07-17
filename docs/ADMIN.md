# ADMIN — Panel de administración
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador
**Relacionado con:** PRD.md, AUTH-USERS.md, DATA-MODEL.md

---

## Filosofía del panel
Herramienta operativa, no de marketing. Diseñada para que Cesar cierre en < 30 s el ciclo:
"me pagaron por transferencia → creo código → lo envío → veo cuando lo canjean → veo cuando
juegan". Todo en el mismo dominio, subrutas `/admin/*`, sin exposición pública.

## Acceso
- Login usual (email + password) contra Supabase Auth
- Middleware verifica `profiles.role = 'admin'` antes de renderizar cualquier ruta admin
- Redirección silenciosa a `/mi-biblioteca` si un usuario normal intenta acceder
- Rutas admin marcadas con `noindex` en meta

## Estructura de rutas
```
/admin                         → Dashboard con métricas
/admin/usuarios                → Listado paginado
/admin/usuarios/[id]           → Detalle de usuario
/admin/casos                   → Listado del catálogo
/admin/casos/[slug]            → Detalle: variantes, evidencias, timeline, estadísticas
/admin/codigos                 → Listado con filtros
/admin/codigos/nuevo           → Crear código (formulario)
/admin/codigos/[id]            → Detalle: estado, historial, acciones
/admin/sesiones                → Listado de sesiones (activas + históricas)
/admin/sesiones/[id]           → Detalle: timeline en vivo, chat, evidencia, veredicto
```

## Módulos

### 1. Dashboard (`/admin`)
Vista de aterrizaje. Tarjetas de métricas + tabla de últimas 10 sesiones.

**Tarjetas (contadores):**
- Usuarios registrados totales / esta semana
- Códigos en estado `sent` sin canjear
- Códigos en estado `activated` (sesiones vivas)
- Sesiones completadas esta semana (con % de acierto)

**Tabla últimas sesiones:**
`fecha | usuario | caso | variante | estado | veredicto | acciones (ver)`

### 2. Gestión de usuarios (`/admin/usuarios`)
**Listado:**
- Búsqueda por email o nombre
- Columnas: email, nombre, ciudad/país, edad, fecha de registro, códigos totales, última sesión
- Filtros: verificados vs no verificados, con sesiones vs sin sesiones

**Detalle (`/admin/usuarios/[id]`):**
- Perfil completo (editable por admin en caso de datos incorrectos)
- Historial de códigos (todos los estados)
- Historial de sesiones jugadas
- Acciones: marcar como VIP (bandera para códigos gratis futuros), bloquear cuenta,
  resetear password (envío de email)

### 3. Gestión de casos (`/admin/casos`) — Fase 1 (IMPLEMENTADO)
Editor visual completo de casos **sin YAML ni terminal**. Reemplaza el flujo de
autoría por archivos para la creación y edición de casos desde el navegador.

**Listado (`/admin/casos`):**
- Tabla: título, ciudad, época (`era_year · era_profile`), estado (borrador/activo),
  variantes activas, sesiones jugadas
- Botón "+ Nuevo caso" arriba a la derecha
- Acciones por fila: **Editar**, **Estadísticas**, **Activar/Desactivar** (server action con auditoría)

**Alta (`/admin/casos/nuevo`):** formulario General (react-hook-form + Zod). Al crear,
redirige al editor multi-tab.

**Editor (`/admin/casos/[slug]/editar`):** seis tabs. Cada sub-entidad persiste por su
propia API (`POST .../{entidad}` con `{ op, data }`) y refresca la lista al vuelo:
- **General:** título, slug (auto del título, editable), sinopsis, ciudad, año,
  `era_profile` (select vhs-80s / cassette-90s / cctv-2000s / smartphone-2010s / default),
  duración, precio de referencia MXN, toggle `active`, y **uploader de voz de briefing**.
- **Sospechosos:** lista editable (nombre, edad, ocupación, relación, descripción, coartada,
  foto). Reordenable (▲▼). Compartidos entre variantes.
- **Evidencias:** código, título, tipo, scope (compartida/variante), minuto entregable,
  forma de entrega, prerequisitos (multi-select), uploader por tipo (doc→imagen opcional,
  audio→mp3, video→mp4), preview inline. Filtros por scope y tipo.
- **Variantes (máx 3):** código A/B/C, culpable (**select de sospechosos, validado en servidor**),
  toggle activo, narrativa + audio de resolución, contexto del Comandante (sin revelar culpable),
  rúbrica (cómo/por qué + palabras clave).
- **Timeline del Comandante:** eventos por minuto (mensaje/voz/evidencia/presión/deadline) con
  payload según tipo y scope de variante. **Preview visual** tipo línea de tiempo.
- **Matriz de validación:** tabla auto-generada (evidencias × variantes) con checkbox
  "consistente" + nota por celda. Documental: avisa si hay evidencias sin validar, no bloquea.

**Estadísticas (`/admin/casos/[slug]/estadisticas`):** sesiones jugadas, aciertos de culpable,
puntaje promedio y veces sorteada por variante.

**Uploads:** `<MediaUploader />` con drag-and-drop, preview y barra de progreso. Sube directo a
Supabase Storage vía URL firmada (`POST /api/admin/media/upload-url`) — nunca expone la service
key. Valida MIME y tamaño (imágenes 5 MB, audio 20 MB, video 100 MB). Ruta:
`casos/{caso_slug}/{categoria}/{filename}` en el bucket privado `media`.

### 3.6 Dirección de Arte por caso — Iteración 3, Fase 3
Tab **"Dirección de Arte"** dentro de `/admin/casos/[slug]/editar`. Genera prompts de IA
consistentes para producir los assets del caso *offline* y subir el resultado.
1. **Estilo general:** textarea `art_direction` + toggle "auto-inyectar" (mete el estilo en el
   bloque `[STYLE]` de todos los prompts). Botón para descargar `GUIA-DE-ARTE.md`.
2. **Imágenes principales:** portada y hero, con prompt editable, "Copiar", "Regenerar" y uploader.
3. **Sospechosos:** por cada uno, descripción física + **rasgos distintivos** (pistas) + prompt;
   botón **"Generar prompt"** (combina físico + rasgos + dirección de arte), "Copiar" y uploader de foto.
4. **Assets adicionales (`case_visual_prompts`):** slots de escena/VHS/evidencia con prompt,
   negative prompt, parámetros técnicos, estado y "Copiar prompt completo"; "+ Agregar slot".
5. **Checklist:** X de Y assets con imagen generada; avisa si el caso está `active` con faltantes.
- Motor puro `lib/engine/prompt-builder.ts` (testeable). API: `GET/PATCH art-direction`,
  `PATCH /api/admin/suspects/[id]/prompt`, `POST /api/admin/cases/[slug]/visual-prompts`,
  `GET .../art-guide` (descarga el Markdown). Ver `docs/GUIA-DIRECCION-DE-ARTE.md`.
- **Consola de juego:** la ficha del sospechoso muestra la imagen, `physical_description` y una
  sección **"Rasgos distintivos"** con ícono de lupa (le indica al jugador que pueden ser pistas).

### 3.5 Biblioteca de assets del sitio (`/admin/assets`) — Iteración 3, Fase 1
CMS ligero para cambiar las imágenes del landing y marketing **sin tocar código**.
- **Grid visual** de todos los "slots" del sitio; filtro por sección (Landing / Cómo funciona /
  Testimonios / Catálogo…). Cada tarjeta: preview actual, nombre, slot, dónde se usa, y botones
  **Cambiar imagen** y **Editar alt**.
- **Cambiar imagen:** modal con uploader drag-and-drop y **preview antes/después**. Al guardar,
  sube a Storage y actualiza el `image_path`. Versionado implícito: nunca se sobrescribe el
  archivo, se apunta al nuevo `site-assets/{slot}/{timestamp}-{filename}`.
- **Componente `<SiteAsset slot="landing.hero" />`:** resuelve el slot contra la BD (cache de RSC),
  renderiza `next/image` con URL firmada y cae a un **placeholder gradiente elegante** si no hay
  imagen. Reemplaza las imágenes hardcodeadas del landing (hero, 3 pasos, avatares de testimonios,
  hero de "cómo funciona").
- **Slots sembrados (0007):** `landing.hero`, `landing.how_step_1..3`,
  `landing.testimonial_1..3_avatar`, `como_funciona.hero`, `catalog.empty_state`.
- **API:** `GET /api/admin/assets`, `PATCH /api/admin/assets/[slot]`,
  `POST /api/admin/assets/upload-url` — todas con `assertAdminApi` + auditoría en `admin_actions`.

### 4. Gestión de códigos (`/admin/codigos`) — El módulo central del piloto
**Listado:**
- Filtros por estado (`draft | sent | redeemed | activated | completed | expired`)
- Filtros por caso y por usuario
- Columnas: código, usuario, caso, estado, `sent_at`, `expira`, `veredicto`
- Botón grande "Crear nuevo código" siempre visible

**Formulario "Crear nuevo código" (`/admin/codigos/nuevo`):**
- Select de usuario (búsqueda por email)
- Select de caso (solo casos `active`)
- Nota opcional (contexto interno: "pagó por SPEI el 12/jul")
- Preview del código generado (formato `TN-XXXX-XXXX`)
- Radio: "guardar como borrador" | "guardar y enviar email ahora"
- Al enviar: dispara email via Resend con plantilla + registro en `admin_actions`

**Detalle (`/admin/codigos/[id]`):**
- Estado actual + timestamps de cada transición
- Historial de envíos (por si se reenvió)
- Acciones según estado:
  - `draft` → enviar, editar (cambiar caso o usuario), eliminar
  - `sent` → reenviar email, revocar, regenerar (nuevo código, mismo usuario/caso)
  - `redeemed` → nada excepto revocar (excepcional)
  - `activated`/`in_progress` → ver sesión, extender tiempo
  - `completed`/`expired` → readonly

### 5. Gestión de sesiones (`/admin/sesiones`)
**Listado:**
- Filtros: activas | históricas | por caso | por usuario
- Columnas: fecha, usuario, caso, variante, tiempo restante, evidencias abiertas, veredicto

**Detalle (`/admin/sesiones/[id]`):**
- **Timeline en vivo** de `session_events` (auto-refresh cada 15 s si activa)
- Chat completo del Comandante ↔ jugadores (readonly)
- Evidencias desbloqueadas con timestamps
- Eventos temporales ejecutados vs pendientes
- Veredicto capturado (si existe)
- Acciones (activas): extender tiempo (justificación requerida), cancelar sesión, forzar evento

## Tamaños de imagen
Cada punto del admin donde se sube una imagen muestra un **panel de especificaciones** con las
dimensiones esperadas, la proporción, el peso máximo y los formatos, más un botón **"Copiar
dimensiones para IA"**. La fuente de verdad es `lib/domain/image-specs.ts` (`IMAGE_SPECS`); para
cambiar un tamaño se edita ahí y todo lo demás se actualiza solo.

**Comportamiento al subir fuera de spec** (avisa, no bloquea):
- Ancho menor al mínimo → aviso de posible imagen borrosa.
- Proporción distinta (>5%) → **"Recortar y subir"** (recorte centrado) o **"Subir así"**.
- Peso mayor al máximo → compresión automática antes de subir.

**Dónde aparece:**
- **Casos → Marketing:** portada (`case.cover`) y hero (`case.hero`).
- **Casos → Sospechosos:** foto (`suspect.portrait`).
- **Casos → Evidencia:** imagen de documento (`evidence.document`) y video (`video.vhs_clip`).
- **Casos → Dirección de Arte:** todos los uploaders + sección **"Referencia de tamaños"** con
  la tabla del caso y botón **"Descargar guía de tamaños"** (Markdown).
- **Biblioteca de Assets (`/admin/assets`):** cada tarjeta muestra `dimensiones · proporción` y el
  modal de cambio de imagen incluye el panel de spec y las validaciones.

La tabla completa por slot vive en `docs/GUIA-DIRECCION-DE-ARTE.md → "Tamaños de imagen"`.

## Emails transaccionales enviados desde admin
1. **Código creado y enviado:** "Tu código para [caso]" + botón "Canjear"
2. **Reenvío de código:** misma plantilla, aclara "reenvío solicitado"
3. **Código regenerado:** "Reemplazamos tu código anterior por uno nuevo"
Plantillas HTML + texto plano, tema oscuro, brand Turno Nocturno.

## Auditoría
Tabla `admin_actions` registra cada acción crítica: crear código, enviar email, revocar,
extender sesión, editar usuario. Campos: `admin_id`, `action`, `entity_type`, `entity_id`,
`payload_json`, `ip`, `at`. Es la primera línea de defensa contra "yo no fui" cuando entren
más admins en V1.

## Wireframe lógico (sin diseño visual)
Sidebar izquierdo permanente con secciones (Dashboard, Usuarios, Casos, Códigos, Sesiones,
Salir). Header con nombre del admin + timezone. Contenido principal con breadcrumbs y
acciones primarias en botón sólido arriba a la derecha. Toasts para confirmaciones.
Componentes: shadcn/ui `Table`, `Dialog`, `Sheet` (para "ver en vivo" sin salir del listado),
`Badge` (estados), `Sonner` (toasts).

## Métricas de éxito del panel (piloto)
- Cesar tarda < 30 s en "crear código + enviar email" (medir con analytics de admin)
- 0 errores de envío de email (verificar en logs de Resend)
- Cesar puede responder soporte ("no me llegó el código", "quiero regenerar") sin abrir Supabase directo
