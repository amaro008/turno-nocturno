# PRD — Turno Nocturno, MVP v0.4
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador
**Relacionado con:** README.md, ARCHITECTURE.md, AUTH-USERS.md, ADMIN.md

---

## 1. Resumen ejecutivo
**Oportunidad:** no existe en español una plataforma de misterio rejugable con casos locales
de ciudades icónicas de LATAM y anfitrión inteligente.
**Solución:** Turno Nocturno — plataforma web completa donde el usuario se registra, canjea
un código, y juega una sesión de 2-3 h conducida por el Comandante IA (chat tipo mensajería +
notas de voz). Culpable variable por sorteo.
**Impacto esperado del MVP:** validar la experiencia extremo a extremo (registro → canje →
sesión → veredicto) con 3-5 mesas reales; medir intención de recompra.

## 2. Usuarios y roles
- **Anónimo (público):** ve landing, catálogo de casos, "cómo funciona". Puede registrarse.
- **Usuario registrado:** su cuenta contiene biblioteca (códigos canjeados, sesiones jugadas)
  y perfil (nombre, email, edad, ciudad/país). Puede canjear códigos.
- **Anfitrión:** rol operacional del usuario que activa y opera la sesión (misma cuenta,
  solo un usuario opera la pantalla compartida). No es un rol técnico separado en MVP.
- **Admin (Cesar, único en MVP):** panel de administración; ve todo, crea y envía códigos.

## 3. Alcance del MVP v0.4

### DENTRO del MVP
**Público / usuario:**
- Landing: hero + catálogo de casos + "cómo funciona" + registro/login
- Registro (email + password) con captura: nombre, edad, ciudad/país
- Login, logout, reset de password (Supabase Auth maneja el trabajo pesado)
- Dashboard "Mi biblioteca": códigos canjeados (activos/expirados), sesiones jugadas
- Canje de código de acceso (input dedicado)
- Detalle de caso "listo para jugar" con botón "Activar sesión"
- Portal de sesión completo (chat, expediente, veredicto, resolución)

**Admin (Cesar):**
- Login separado o mismo (con rol `admin` en BD)
- Dashboard: métricas básicas (usuarios totales, códigos activos, sesiones en curso, casos jugados esta semana)
- Gestión de **usuarios** (listar, ver detalle, marcar como VIP, bloquear)
- Gestión de **casos** (listar catálogo, activar/desactivar variantes, ver estadísticas por caso)
- Gestión de **códigos** (crear código para {usuario, caso}, ver estado, revocar,
  reenviar por email con un click)
- Gestión de **sesiones** (listar activas, ver evento por evento en tiempo real, extender tiempo, cancelar)

**Contenido:**
- Caso 001 "La Última Transmisión" con variantes A y B producidas (C queda diseñada)

### FUERA del MVP (parking lot V1)
- Pasarela de pagos (Stripe / MercadoPago) y auto-generación de códigos por webhook
- Facturación fiscal CFDI (activar cuando ingresos > $3k MXN/mes)
- Suscripción mensual y descuentos
- Multi-dispositivo realtime (cada jugador en su celular)
- Variante C del Caso 001; catálogo multi-caso
- Panel de admin con exportaciones y reportes avanzados
- Roles admin secundarios (soporte, editor de casos)

### FUERA del MVP (V2+)
- Línea B2B (team building con reporte de dinámica)
- Editor visual de casos
- Programa de creadores true crime / marketplace

## 4. Requerimientos funcionales (MVP v0.4)

### Registro y sesión de usuario
- RF-U01 Registro con email + password + nombre + edad + ciudad/país
- RF-U02 Verificación de email (Supabase Auth)
- RF-U03 Login, logout, reset de password
- RF-U04 Edición de perfil básica
- RF-U05 Dashboard "Mi biblioteca" con códigos y sesiones del usuario
- RF-U06 Canje de código: input, validación, si es válido queda en biblioteca

### Sesión de juego (refinado en Fase 3–4)
- RF-S01 **Hoja de misión** antes de arrancar (Refactor F3): situación, 3 objetivos, material
  disponible, reglas, reloj; el reloj y el sorteo de variante ocurren al confirmar "Iniciar Turno
  Nocturno" (no al salir de biblioteca)
- RF-S02 Sorteo de variante al confirmar el inicio (uniforme entre `variants WHERE active`)
- RF-S03 Chat Comandante: streaming SSE, "escribiendo…", historial persistido; input textarea
  (Enter envía, Shift+Enter salta línea)
- RF-S04 Notas de voz (pregrabadas + generadas) con UI de mensajería
- RF-S06 Motor de eventos temporales por caso (idempotente, sobrevive recargas)
- RF-S07 **Cronómetro grande H:MM:SS con color por umbral**: verde (>60 min), ámbar (30–60),
  rojo (<30); visible en la barra superior
- RF-S08 **Consola rebalanceada (Refactor F4): el Expediente es protagónico (65%) y el Comandante
  es columna secundaria (35%)**. El material base está **abierto desde el minuto 0**; el Comandante
  **no entrega evidencia bajo demanda**, solo responde dudas específicas sobre lo ya abierto.
- RF-S08b **Expediente con tabs por tipo**: Reporte inicial (abierto por default), Sospechosos
  (ficha pública, sin variante), Documentos, Fotos, Audios, Videos, Testimonios, Registros
  (cada uno con su visor + placeholders de evidencia bloqueada), Notas, Códigos.
- RF-S08c **Notificaciones de evidencia nueva**: badge por tab + toast "Nueva evidencia recibida:
  …" + chime discreto (con mute) + aviso breve del Comandante en el chat.
- RF-S09 Desbloqueo por código de evidencia (compatibilidad con dinámica de códigos impresos)
- RF-S10 Sistema de pistas (3 niveles, resta puntuación); "Pedir pista" visible en la columna del
  Comandante + contador N/3.
- RF-S11 Guardarraíles reforzados del Comandante: no conoce al culpable; recibe solo la ficha
  pública + subset de variante sin culpabilidad + evidencia con `public_description` (contenido
  solo de las abiertas); jamás entrega evidencia; evaluación de veredicto aislada.
- RF-S12 Veredicto → evaluación → resolución narrada
- RF-S13 Reanudación tras recarga (chat, evidencia, tiempo, pistas y notas persisten)
- RF-S14 **Protección anti-descarga** (fricción razonable): URLs firmadas TTL 10 min,
  `user-select:none` y menú contextual bloqueado en el Expediente, media con
  `controlsList="nodownload noremoteplayback"` + `disablePictureInPicture`, marca de agua con
  código de sesión y fecha, `referrer: no-referrer`. Impresión deferida a V1.

### Administración (nuevos en v0.4)
- RF-A01 Middleware que restringe rutas `/admin/*` a usuarios con `role='admin'`
- RF-A02 Dashboard admin con métricas del piloto (contadores, últimas 10 sesiones)
- RF-A03 Listado paginado de usuarios con búsqueda por email/nombre
- RF-A04 Detalle de usuario: perfil + códigos + sesiones históricas
- RF-A05 Listado de casos con estado (activo/borrador) y contador de sesiones jugadas
- RF-A06 Toggle de variantes activas por caso (permite publicar C después sin código)
- RF-A07 **Crear código:** seleccionar usuario + caso → generar código único de 8 caracteres →
  opción "enviar por email ahora"
- RF-A08 Listado de códigos con filtros (usuario, caso, estado: pendiente/canjeado/activo/expirado)
- RF-A09 Revocar código no canjeado
- RF-A10 Reenviar email de código con un click
- RF-A11 Listado de sesiones activas con "ver en vivo" (stream de session_events)
- RF-A12 Extender tiempo de sesión activa (excepción operativa)

## 5. Requerimientos no funcionales
- Primera palabra del Comandante < 2 s (streaming)
- Costo variable por sesión < $3 USD
- Registro < 60 s de fricción
- Accesibilidad: transcripción de notas de voz, contrastes AA
- Datos personales: aviso de privacidad publicado (LFPDPPP México); consentimiento explícito
  al registrar; capacidad de solicitar borrado por email al admin (manual en MVP)
- Admin panel: mismo dominio, subrutas `/admin/*`, sin exposición pública (índice noindex)
- Estado en Supabase (no en cliente) para preparar multi-dispositivo V1

## 6. Métricas de éxito del piloto
- ≥15 usuarios registrados
- ≥8 códigos canjeados con sesión completada
- 0 incidencias de acceso indebido a rutas admin (verificado en logs)
- Tiempo promedio de admin para "crear + enviar código" < 30 s
- ≥50% de jugadores aciertan con ≤2 pistas
- ≥60% de jugadores completan perfil (intención de volver)

## 7. Restricciones
Stack: Next.js 14 + Vercel + Supabase (Auth + BD + Storage) + GitHub (`turno-nocturno`).
UI: shadcn/ui + Tailwind + Framer Motion. Email transaccional: Resend.
Presupuesto piloto APIs: $30-50 USD. Construible en Claude Code en 3-4 fines de semana.
