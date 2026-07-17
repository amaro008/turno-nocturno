# AUTH-USERS — Registro, autenticación y ciclo de vida del código
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador
**Relacionado con:** PRD.md, DATA-MODEL.md, ADMIN.md

---

## Autenticación
- **Motor:** Supabase Auth (email + password + verificación por email)
- **Alternativa:** Magic Link deshabilitado en MVP (no bloquea, se puede añadir después)
- **OAuth** (Google/Apple) queda para V1
- **Roles:** columna `role` en tabla `profiles` con valores `user` y `admin`. Un solo admin en MVP.
- **Middleware:** `middleware.ts` de Next.js protege `/mi-biblioteca/*`, `/s/*`, `/admin/*`
- **Rutas admin:** doble check en middleware Y en cada API route de `/api/admin/*` (defense in depth)

## Datos capturados al registrar
| Campo | Obligatorio | Justificación |
|-------|-------------|---------------|
| email | sí | login + envío de códigos |
| password | sí | Supabase Auth |
| full_name | sí | personalización + admin |
| birth_year | sí | derivar edad para segmentación; menos sensible que fecha exacta |
| country | sí | mercado LATAM segmentado |
| city | opcional | insight para casos futuros por ciudad |
| accepted_terms_at | sí | requisito legal |
| accepted_privacy_at | sí | requisito legal LFPDPPP México |

Datos de comportamiento (visitas, sesiones jugadas, tiempo en app) los captura analytics
(Vercel Analytics + PostHog en V1), no capturamos manualmente en formularios.

## Aviso de privacidad y términos
- Pantalla de registro con dos checkboxes obligatorios y links a `/terminos` y `/privacidad`
- Contenido base generable con plantilla LFPDPPP + revisión legal antes de cobrar
- En MVP el borrado de datos se solicita al admin por email; queda registrado en tabla `data_deletion_requests`

## Ciclo de vida del código de acceso

### Estados
```
draft → sent → redeemed → activated → in_progress → completed
                                                  ↘ expired
```

- **draft:** creado por admin, aún no enviado por email
- **sent:** email enviado al usuario (marca de tiempo `sent_at`)
- **redeemed:** el usuario capturó el código y quedó en su biblioteca (`redeemed_at`).
  > (Fase 3) Desde biblioteca "Activar sesión" lleva al **briefing** (`/s/[code]/briefing`);
  > el código sigue en `redeemed` mientras el usuario lee el caso. El reloj aún no corre.
- **activated:** el usuario **confirmó "INICIAR TURNO NOCTURNO"** en el briefing → se crea la
  sesión, se sortea la variante y arranca `activated_at`. (Antes ocurría al salir de biblioteca.)
- **in_progress:** sesión en curso, dentro de la ventana de resolución
- **completed:** veredicto entregado (correcto o no)
- **expired:** dos causas — no redimido en ventana de 5 días O activado pero no completado en la ventana de sesión

### Reglas de negocio (críticas)
1. **Cada código nace ligado a un `user_id` y un `case_id`** (no es cupón anónimo en MVP)
2. **Ventana de canje: 24 h desde `sent_at`** — el usuario tiene un día para capturar el código
   > Esto crea urgencia y protege contra reventa. Si vence, admin puede regenerar.
3. **Ventana total de vida: 5 días desde `created_at`** — el código muere al día 5 hagas lo que hagas
   > Protege al negocio de "compré hace un mes, quiero jugar hoy con precio viejo"
4. **Ventana de sesión: 24 h desde `activated_at`** — una vez activado el reloj de sesión, hay 24 h
   para completar (el juego dura 2-3 h, pero se permite abandonar y retomar)
5. **Un solo uso:** una vez `activated`, el código no se puede volver a activar
6. **Un código = una sesión = una variante sorteada** (no permite "regenerar" para intentar otra variante)

### Cálculo de la fecha efectiva de expiración
```
effective_expires_at = MIN(
  created_at + 5 days,                          -- vida total
  CASE WHEN activated_at IS NOT NULL
       THEN activated_at + 24 hours              -- ventana de sesión
       ELSE sent_at + 24 hours                   -- ventana de canje (si aún no activó)
  END
)
```
Este cálculo vive en `lib/engine/code-lifecycle.ts` (puro TS, testeable) y se refleja
en la UI del usuario ("expira en 3h 42min") y en admin.

## Flujo del usuario (visión rápida, detalle en USER-FLOWS.md)
1. Recibe email del admin: "Tu código para *La Última Transmisión* es `TN-BUHO-4471`" + botón "Canjear ahora"
2. Login o registro
3. Pega el código en `/mi-biblioteca` → sistema valida (existe, no expirado, es para este usuario)
4. Aparece la tarjeta del caso en biblioteca con "Activar sesión" y cuenta regresiva de canje/vida
5. Cuando quiera, presiona "Activar sesión" → confirmación ("una vez activado no hay vuelta atrás,
   tendrás 2-3 h para resolver, y hasta 24 h para completar")
6. Entra al portal de sesión

## Seguridad
- Códigos generados con `crypto.randomUUID` y formateados como `TN-XXXX-XXXX` para uso humano
- Rate limit en `/api/codes/redeem` (5 intentos por usuario por hora)
- Auditoría: cada acción admin escribe en `admin_actions` con `admin_id`, acción, timestamp, IP
- Emails via Resend con dominio propio verificado (SPF + DKIM)
