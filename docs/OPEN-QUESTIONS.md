# OPEN-QUESTIONS — Pendientes y parking lot
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador

---

## Decisiones pendientes
1. Búsqueda IMPI del nombre y registro del dominio `turnonocturno.app` (o `.mx`) antes de cobrar públicamente
2. Voz del Comandante: 3 pruebas A/B en ElevenLabs (veterano rasposo | sobrio institucional | joven agudo)
3. Nombre propio del Comandante (personaje transversal a toda la serie)
4. ¿Veredicto fallido termina la sesión o permite segundo intento con castigo?
5. ¿El anfitrión elige duración (120/150/180 min) o es fija por caso?
6. Modelo Anthropic exacto para runtime: sonnet vs opus (medir latencia y calidad)
7. Aviso de privacidad y términos: revisión legal antes de cobrar (borrador base con plantilla LFPDPPP)
8. ¿Marca visual del panel admin diferente del portal público, o mismo brand? (recomendado: mismo brand)
10. **Optimización móvil (deferida a V1, Fase 5):** en MVP el portal de sesión está pensado para
    pantalla compartida (desktop/tablet). En tablet horizontal (≥1024px) se mantienen las 2 columnas;
    en tablet vertical y menor, chat y Expediente se apilan con un toggle superior. En móvil es
    **aceptable pero no optimizado**. V1 debe rediseñar la consola para móvil (¿un solo panel con
    navegación por gestos? ¿el chat como hoja inferior deslizable?).

9. **Impresión de evidencia (deferida a V1, Fase 4):** en MVP NO se habilita impresión. Decisión
   pendiente: ¿imprimir a PDF con marca de agua (código de sesión + fecha), o solo un "modo
   lectura fácil" a pantalla completa para leer en pantalla sin descargar? Trade-off: la impresión
   mejora la mesa presencial pero abre un vector de fuga de la evidencia (que en MVP se protege con
   URLs firmadas de TTL corto, anti-selección, anti-menú-contextual y marca de agua).

## Riesgos identificados
- R1: extracción social del culprit → arquitectura lo impide; medir intentos
- R2: latencia de voz rompe inmersión → "escribiendo…" + streaming; fallback texto
- R3: consistencia de variantes → matriz obligatoria versionada
- R4: licencia comercial de voces ElevenLabs → verificar plan antes de cobrar
- R5: eventos temporales percibidos como spam → calibrar en piloto
- R6: anacronismos en casos de época → checklist como quality gate
- R7: costos de video-gen si escala → cache y reutilización entre variantes cuando aplique
- R8: **admin sobrecargado enviando códigos manualmente** → medir tiempo por código en piloto;
  si > 30 min/día, priorizar automatización con pasarela en V1
- R9: **usuario reporta "no me llegó"** → Resend dashboard + botón reenviar; medir tasa
- R10: **códigos expirados por descuido de Cesar** → dashboard admin destaca códigos por vencer
- R11: intento de compartir cuenta (mismo login desde varios dispositivos) → aceptable en MVP;
  la limitación es "un código = una sesión activa", no "un usuario = un login"

## Parking lot V1 (post-piloto, si valida)
- **Pasarela de pagos** (Stripe Payment Links + webhook automático de generación de código)
- Facturación fiscal CFDI (cuando ingresos > $3k MXN/mes)
- Agendamiento con hora fija (el Comandante "cita" a los jugadores por adelantado)
- Catálogo multi-caso y multi-ciudad
- Variante C del Caso 001
- Expediente de la noche compartible (marketing orgánico)
- Multi-dispositivo realtime
- Panel admin con exportaciones y reportes avanzados
- Roles admin secundarios (soporte, editor de casos)
- Cron de expiración automático
- Analytics con PostHog (funnels: registro → canje → activación → veredicto)
- Suscripción mensual como segundo modelo

## Parking lot V2
- Línea B2B (asimetría de información + reporte de dinámica de equipo)
- Editor de casos asistido por IA
- Casos de época moderna con evidencia de chats/redes (componentes UI nuevos)
- Marketplace de autores true crime
- Migración a monorepo con `apps/b2c` + `apps/b2b`

## Métricas que sí capturamos desde MVP
- Registros por semana
- Códigos creados / enviados / canjeados / activados / completados (funnel simple en admin)
- Tiempo promedio del admin por "crear + enviar código"
- Tasa de veredicto correcto por variante
- Pistas usadas por sesión
- Uso de eventos temporales (¿los perciben?)
- Intentos de extracción social (guardrail_attempt)
