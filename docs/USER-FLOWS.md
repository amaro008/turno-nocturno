# USER-FLOWS — Flujos críticos
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador
**Relacionado con:** PRD.md, AUTH-USERS.md, ADMIN.md, DATA-MODEL.md

---

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
5. Redirige a biblioteca; tarjeta del caso aparece con "Activar sesión" y countdown de vida útil
6. Si inválido: mensaje claro (código incorrecto / expirado / no es tuyo)

## Flujo 3 — Usuario activa sesión
1. En biblioteca, click "Activar sesión" en la tarjeta del caso
2. Diálogo de confirmación: "Una vez activada tendrás 2-3 h para resolver el caso y
   hasta 24 h para completarlo. ¿Listos?"
3. Click "Sí, activar"
4. Backend:
   - Cambia `access_codes.status` → `activated`, `activated_at = now()`
   - Sortea variante entre `variants WHERE case_id = X AND active`
   - Crea `sessions` con `activated_at = now()`, `expires_at = activated_at + 24h`
5. Redirige a `/s/[access_code]`
6. Pantalla CRT de encendido → chat abre con "escribiendo…" → briefing con voz

## Flujo 4 — Sesión de juego (bucle principal)
1. Jugadores leen evidencia desde chat o Expediente
2. Interrogan al Comandante escribiendo → streaming SSE
3. Piden evidencia → si gating permite, llega como tarjeta
4. Códigos impresos/descubiertos también desbloquean evidencia (input en Expediente)
5. **Eventos temporales del Caso 001:**
   - min 45: peritaje nuevo (según variante)
   - min 75: nota de voz pidiendo avances
   - min 105: presión del MP + micro-pista si van perdidos
   - min 135: ultimátum
   - min 150: exige veredicto
6. Pistas por chat (máx 3), restan puntuación

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
