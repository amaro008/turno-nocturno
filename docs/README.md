# README — TURNO NOCTURNO
**Proyecto:** Turno Nocturno — plataforma B2C completa de casos criminales con IA
**Cliente:** Interno (Cesar)
**Versión:** 0.4 — 16/jul/2026
**Estado:** Borrador
**Repositorio:** `turno-nocturno` (GitHub) → deploy Vercel
**Relacionado con:** PRD.md, ARCHITECTURE.md, PROJECT-STRUCTURE.md, AUTH-USERS.md, ADMIN.md, USER-FLOWS.md, DATA-MODEL.md, INTEGRATIONS.md, CASO-PILOTO.md, OPEN-QUESTIONS.md

---

## Qué es Turno Nocturno
Plataforma web donde un grupo de amigos (2-6 personas) reabre un caso criminal archivado y
lo resuelve en una sesión de 2-3 horas. Cada caso está ambientado en una **ciudad icónica**
y una **época concreta**. Cada sesión sortea una de **2-3 resoluciones** del caso.

## La app COMPLETA incluye
1. **Landing pública** con el catálogo de casos y cómo funciona
2. **Registro de usuario** (nombre, email, edad, ciudad/país)
3. **"Mi biblioteca"**: casos comprados/canjeados y sesiones jugadas
4. **Canje de código** de acceso (código único, ventana temporal doble)
5. **Portal de sesión**: chat con el Comandante + expediente + veredicto
6. **Panel de administración** para el operador único (Cesar): gestión de usuarios, casos,
   códigos, sesiones y métricas
7. **Pipeline de autoría** de casos (CLI Python offline, no parte de la app web)

## El marco narrativo
Los jugadores son detectives del PRESENTE reabriendo casos archivados. El **Comandante** los
contacta por mensajería tipo WhatsApp (chat, notas de voz, adjuntos de evidencia). La
evidencia interior es 100% de época.

## Alcance del MVP v0.4
Producto completo funcional **sin pasarela de pagos** — el admin (Cesar) genera códigos
manualmente y los envía por WhatsApp/email después de recibir transferencia offline.
Todo lo demás es real: registro, biblioteca, canje, sesión, admin panel, un caso con dos
variantes. Pasarela y automatización de venta quedan como próximo hito (V1).

## Reglas de negocio clave del código de acceso
- El código nace ligado a **un usuario** y **un caso** (no es un "cupón anónimo" en MVP)
- El usuario tiene **24 h desde que canjea el código** para hacer el primer uso (activar sesión)
- Una vez activado, la sesión vive **5 días desde la creación del código** para completarse
- El código es **de un solo uso** (una sesión). Si no se canjea, expira al día 5

## Cómo navegar la documentación
1. `PRD.md` — qué se construye y qué NO
2. `ARCHITECTURE.md` — stack, pipelines, decisiones técnicas
3. `PROJECT-STRUCTURE.md` — estructura de carpetas del repo
4. `AUTH-USERS.md` — registro, autenticación, biblioteca y ciclo de vida del código
5. `ADMIN.md` — panel de administración (funciones, permisos, wireframe lógico)
6. `USER-FLOWS.md` — todos los flujos, públicos y admin
7. `DATA-MODEL.md` — entidades Supabase
8. `INTEGRATIONS.md` — Anthropic, ElevenLabs, video-gen, email transaccional
9. `CASO-PILOTO.md` — Caso 001 y sus variantes
10. `OPEN-QUESTIONS.md` — pendientes y parking lot

## Principios rectores
1. El portal NUNCA genera medios de evidencia en tiempo real
2. La única IA en vivo es el Comandante
3. Cada caso declara ciudad + época; evidencia adaptada al momento histórico
4. UX moderno tipo mensajería
5. Arquitectura preparada para multi-dispositivo realtime (V1)
6. En MVP el admin es **una sola persona** (Cesar); los permisos ya distinguen roles para
   agregar administradores en V1 sin migración
