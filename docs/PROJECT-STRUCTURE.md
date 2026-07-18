# PROJECT-STRUCTURE — Estructura del repositorio
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador
**Relacionado con:** ARCHITECTURE.md

---

## Filosofía
Monorepo simple con una sola app Next.js. Cuatro reglas de organización:

1. **Colocation por feature** dentro de `app/` — todo lo del chat vive junto, todo lo del admin también
2. **Separación estricta** cliente/servidor: `lib/server/*` nunca se importa desde componentes cliente
3. **Motor de dominio puro** en `lib/engine/*` — cero imports de Next/React/Supabase; testeable con Vitest
4. **Autoría fuera del bundle**: `tools/*` excluido de Vercel

---

## Estructura completa

```
turno-nocturno/
│
├── app/                            # Next.js 14 App Router
│   ├── layout.tsx                  # Layout raíz: providers, fuentes, metadata global
│   ├── page.tsx                    # Landing pública
│   ├── globals.css                 # Tailwind + variables de tema
│   │
│   ├── (marketing)/                # Rutas públicas
│   │   ├── layout.tsx
│   │   ├── casos/page.tsx          # Catálogo público
│   │   ├── casos/[slug]/page.tsx   # Detalle de caso público
│   │   ├── como-funciona/page.tsx
│   │   ├── terminos/page.tsx       # Legal
│   │   └── privacidad/page.tsx     # Aviso de privacidad LFPDPPP
│   │
│   ├── (auth)/                     # Auth y perfil
│   │   ├── layout.tsx
│   │   ├── registro/page.tsx
│   │   ├── login/page.tsx
│   │   ├── recuperar/page.tsx
│   │   └── verificar/page.tsx      # Callback de verificación de email
│   │
│   ├── mi-biblioteca/              # Zona autenticada del usuario
│   │   ├── layout.tsx              # Protegida por middleware
│   │   ├── page.tsx                # Biblioteca (códigos + sesiones)
│   │   ├── canjear/page.tsx        # Input de código
│   │   ├── perfil/page.tsx
│   │   └── _components/
│   │       ├── LibraryCard.tsx     # Tarjeta de código canjeado con countdown
│   │       ├── SessionHistoryList.tsx
│   │       └── RedeemForm.tsx
│   │
│   ├── s/[code]/                   # Portal de sesión de juego
│   │   ├── session.css            # Estilos de la consola (3 zonas, tabs, players…)
│   │   ├── page.tsx                # Server: valida sesión → SessionApp (referrer:no-referrer)
│   │   ├── briefing/              # Fase 3 — preparación antes de arrancar el reloj
│   │   │   ├── page.tsx           #   caso + sospechosos + reglas + recomendaciones
│   │   │   ├── StartTurnButton.tsx#   "INICIAR TURNO NOCTURNO" → POST /api/sessions/activate
│   │   │   └── briefing.css
│   │   └── _components/           # Fase 4 — consola enriquecida
│   │       ├── SessionApp.tsx     # Orquestador: barra sup, chat 40%, expediente 60%, barra inf
│   │       ├── types.ts           # Tipos espejo de /state
│   │       ├── markdown.tsx       # Render Markdown mínimo y seguro
│   │       ├── useNewEvidenceNotification.ts  # Badges por tab + toasts
│   │       └── expediente/
│   │           ├── SuspectsGrid.tsx        # Grid + modal de ficha + descartar (local)
│   │           ├── DocumentsList.tsx       # Lista + visor con marca de agua / anti-descarga
│   │           ├── AudioPlayer.tsx         # Controles (±10s) + transcripción
│   │           ├── VideoPlayer.tsx         # controlsList + disablePictureInPicture
│   │           ├── NotesBoard.tsx          # Auto-guardado en sessions.player_notes
│   │           └── EvidenceCodeInput.tsx   # Desbloqueo por código + historial
│   │
│   ├── admin/                      # Panel de administración (solo role=admin)
│   │   ├── layout.tsx              # Sidebar + header admin
│   │   ├── page.tsx                # Dashboard con métricas
│   │   ├── usuarios/
│   │   │   ├── page.tsx            # Listado
│   │   │   └── [id]/page.tsx       # Detalle
│   │   ├── casos/                # Gestión de casos (Fase 1 — IMPLEMENTADO)
│   │   │   ├── casos.css         # Estilos del módulo (tabs, uploader, entidades, matriz)
│   │   │   ├── layout.tsx        # Carga casos.css
│   │   │   ├── actions.ts        # toggleCaseActive (server action + auditoría)
│   │   │   ├── page.tsx          # Listado mejorado + acciones por fila
│   │   │   ├── nuevo/page.tsx    # Alta (tab General) → redirige a editar
│   │   │   ├── [slug]/editar/page.tsx        # Carga caso + sub-entidades → CaseEditor
│   │   │   ├── [slug]/estadisticas/page.tsx  # Métricas del caso
│   │   │   └── _components/                  # Refactor F2 — editor de 4 tabs
│   │   │       ├── CaseEditor.tsx            # Contenedor de los 4 tabs
│   │   │       ├── GeneralTab.tsx            # General: metadatos+marketing+arte+banner
│   │   │       ├── CaseGeneralForm.tsx       # Metadatos (react-hook-form + Zod)
│   │   │       ├── MarketingTab.tsx          # Sinopsis pública, cover, hero, dificultad
│   │   │       ├── ArtDirectionTab.tsx       # Dirección de arte (prompts de IA, plegable)
│   │   │       ├── StatusBanner.tsx          # Banner de estado + bloqueos/advertencias
│   │   │       ├── PersonajesTab.tsx         # Grid + Sheet (público/confidencial/variante)
│   │   │       ├── EvidenciasTab.tsx         # Manager por tipo (sub-tabs) + validador
│   │   │       ├── GuionTab.tsx              # Variantes + Timeline + vista consolidada
│   │   │       ├── VariantsTab.tsx           # Variantes (culpable validado + rúbrica)
│   │   │       ├── TimelineTab.tsx           # Timeline + preview de línea de tiempo
│   │   │       ├── Sheet.tsx                 # Panel lateral (CSS propio, estilo shadcn)
│   │   │       ├── MediaUploader.tsx         # Uploader drag-and-drop → Storage firmado
│   │   │       └── entityApi.ts              # Helper de cliente para CRUD de sub-entidades
│   │   ├── codigos/
│   │   │   ├── page.tsx            # Listado con filtros
│   │   │   ├── nuevo/page.tsx      # Crear código + enviar
│   │   │   └── [id]/page.tsx       # Detalle
│   │   ├── sesiones/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx       # Vista en vivo
│   │   └── _components/
│   │       ├── AdminSidebar.tsx
│   │       ├── AdminHeader.tsx
│   │       ├── MetricCard.tsx
│   │       ├── CodeCreateForm.tsx
│   │       ├── SessionLiveView.tsx
│   │       ├── UserTable.tsx
│   │       └── CodeStatusBadge.tsx
│   │
│   └── api/                        # API Routes
│       ├── auth/
│       │   └── callback/route.ts           # Callback OAuth/verificación (Supabase)
│       ├── codes/
│       │   ├── redeem/route.ts             # POST: canjear código
│       │   └── validate/route.ts           # POST: validar sin canjear
│       ├── sessions/
│       │   ├── activate/route.ts           # POST: activar desde biblioteca
│       │   ├── [id]/state/route.ts         # GET: reanudación
│       │   └── [id]/tick/route.ts          # POST: eventos temporales
│       ├── chat/
│       │   ├── stream/route.ts             # SSE Anthropic
│       │   └── voice/route.ts              # ElevenLabs TTS streaming
│       ├── evidence/
│       │   ├── unlock/route.ts
│       │   └── [code]/url/route.ts
│       ├── verdict/
│       │   └── submit/route.ts
│       └── admin/                          # TODAS con assertAdminApi + auditoría
│           ├── cases/route.ts              # POST crear caso (Fase 1)
│           ├── cases/[slug]/route.ts       # PATCH editar caso + matriz (Fase 1)
│           ├── cases/[slug]/suspects/route.ts    # POST { op } CRUD sospechosos (Fase 1)
│           ├── cases/[slug]/evidence/route.ts    # POST { op } CRUD evidencias (Fase 1)
│           ├── cases/[slug]/variants/route.ts    # POST { op } CRUD variantes (Fase 1)
│           ├── cases/[slug]/timeline/route.ts    # POST { op } CRUD timeline (Fase 1)
│           └── media/upload-url/route.ts   # POST URL firmada de subida (Fase 1)
│           # Códigos siguen como server actions en app/admin/actions.ts
│
├── lib/                            # Lógica compartida
│   ├── server/                     # SOLO servidor
│   │   ├── supabase.ts                     # Cliente con service key
│   │   ├── supabase-user.ts                # Cliente con JWT de usuario (RLS)
│   │   ├── anthropic.ts
│   │   ├── elevenlabs.ts
│   │   ├── resend.ts                       # Cliente email
│   │   ├── prompts/
│   │   │   ├── commander.base.ts
│   │   │   ├── commander.build.ts
│   │   │   └── rubric.evaluator.ts
│   │   ├── guardrails.ts
│   │   ├── storage.ts                      # URLs firmadas
│   │   ├── auth.ts                         # assertAdmin, getSession, etc.
│   │   └── audit.ts                        # Escribe en admin_actions
│   │
│   ├── engine/                     # Motor puro (testeable)
│   │   ├── session-machine.ts
│   │   ├── timeline.ts
│   │   ├── evidence-gating.ts
│   │   ├── variant-sortition.ts
│   │   ├── verdict-scoring.ts
│   │   └── code-lifecycle.ts               # Estados y expiración del código
│   │
│   ├── domain/                     # Tipos y contratos
│   │   ├── case.ts
│   │   ├── variant.ts
│   │   ├── evidence.ts
│   │   ├── timeline-event.ts
│   │   ├── session.ts
│   │   ├── chat-message.ts
│   │   ├── verdict.ts
│   │   ├── user.ts
│   │   ├── code.ts                         # Access code
│   │   └── admin-action.ts
│   │
│   ├── emails/                     # Plantillas React Email
│   │   ├── CodeCreated.tsx
│   │   ├── CodeResent.tsx
│   │   ├── CodeRegenerated.tsx
│   │   └── _shared/Layout.tsx
│   │
│   ├── ui/
│   │   ├── cn.ts
│   │   ├── format-time.ts
│   │   ├── format-countdown.ts             # "3d 4h 12min"
│   │   └── era-styles.ts
│   │
│   └── analytics/
│       └── track.ts
│
├── components/                     # Globales reutilizables
│   ├── AppHeader.tsx                       # Header autenticado (biblioteca/admin)
│   ├── AtmoImage.tsx                       # <img> con respaldo (Unsplash → picsum)
│   ├── Initials.tsx                        # Placeholders con iniciales sobre gradiente (Fase 5)
│   ├── GradientPlaceholder.tsx             # Fallback gradiente de <SiteAsset> (it3 F1)
│   ├── SiteAsset.tsx                        # Resuelve slot de site_assets → next/image (it3 F1)
│   ├── Skeleton.tsx                        # Skeletons de carga (Fase 5)
│   ├── EmptyState.tsx                      # Estado vacío con ilustración (Fase 5)
│   └── noir/                               # Sistema visual noir (it3 F2)
│       ├── noir.css                        #   estilos de componentes + home noir
│       ├── ConfidentialStamp.tsx           #   sello de tinta (variantes)
│       ├── PaperclipCorner.tsx             #   clip metálico SVG
│       ├── ManillaFolder.tsx               #   folder de expediente que envuelve contenido
│       ├── TypewriterText.tsx              #   texto a máquina (cursor; sonido opcional)
│       ├── FilingCabinet.tsx               #   archivero con cajones clickeables
│       ├── CoffeeStain.tsx                 #   mancha de café SVG
│       ├── RedString.tsx                   #   hilo rojo entre puntos (conspiration board)
│       ├── InkSplotch.tsx                  #   mancha de tinta
│       └── Reveal.tsx                      #   fade + rise al entrar en viewport (Framer)
│
│   # Fase 5 extra: app/robots.ts, app/(marketing)/opengraph-image.tsx,
│   # loading.tsx (skeletons) en /casos, /mi-biblioteca y /s/[code],
│   # y micro-interacciones Framer Motion en la consola.
│
├── middleware.ts                   # Auth + role checks + redirecciones
│
├── tools/                          # Offline, no se despliega
│   ├── autoria/
│   │   ├── gen_audios.py
│   │   ├── gen_videos.py
│   │   ├── post_fx.py
│   │   ├── publish.py
│   │   ├── validate_matrix.py
│   │   ├── requirements.txt
│   │   └── README.md
│   ├── scripts/
│   │   ├── create-admin.ts                 # Setup inicial: crear el primer admin
│   │   ├── seed-caso-001.ts
│   │   └── expire-codes.ts                 # Job manual de expiración (hasta activar cron)
│   └── generators/
│       └── new-case-template/
│
├── content/                        # Fuentes de casos
│   └── casos/
│       └── 001-ultima-transmision/
│           ├── caso.yaml
│           ├── variantes/
│           │   ├── A-trevino.yaml
│           │   ├── B-elena.yaml
│           │   └── C-ibarra.yaml
│           ├── evidencia/
│           ├── comandante/
│           └── matriz-validacion.md
│
├── supabase/
│   ├── migrations/
│   │   ├── 0001_auth_and_profiles.sql
│   │   ├── 0002_cases_variants_evidence.sql
│   │   ├── 0003_case_timeline.sql
│   │   ├── 0004_access_codes.sql
│   │   ├── 0005_sessions_and_events.sql
│   │   ├── 0006_chat_messages.sql
│   │   ├── 0007_verdicts.sql
│   │   └── 0008_admin_actions_audit.sql
│   ├── seed.sql
│   ├── policies.sql                        # RLS por tabla
│   └── README.md
│
├── docs/                           # Esta documentación
│   ├── README.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── PROJECT-STRUCTURE.md
│   ├── AUTH-USERS.md
│   ├── ADMIN.md
│   ├── USER-FLOWS.md
│   ├── DATA-MODEL.md
│   ├── INTEGRATIONS.md
│   ├── CASO-PILOTO.md
│   └── OPEN-QUESTIONS.md
│
├── tests/
│   ├── engine/
│   │   ├── timeline.test.ts
│   │   ├── evidence-gating.test.ts
│   │   ├── verdict-scoring.test.ts
│   │   └── code-lifecycle.test.ts          # CRÍTICO: cubre expiración doble ventana
│   └── integration/
│       ├── redeem-flow.test.ts
│       └── session-flow.test.ts
│
├── public/
│   ├── fonts/
│   └── brand/
│
├── .env.example
├── .env.local                      # (gitignored)
├── .gitignore
├── .eslintrc.json                  # Regla custom: no imports de lib/server desde componentes cliente
├── .prettierrc
├── next.config.mjs                 # Excluye tools/ del bundle
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── vercel.json
└── LICENSE
```

## Reglas de importación (ESLint)
1. Componentes cliente **nunca** importan de `lib/server/*`
2. `lib/engine/*` es puro TypeScript
3. `lib/domain/*` no importa de nadie — solo tipos
4. `tools/*` excluido del bundle en `next.config.mjs`
5. `content/*` no se sirve al cliente directamente
6. `app/admin/*` y `app/api/admin/*` no importan de `app/mi-biblioteca/*` ni al revés

## Convenciones
- Componentes React: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilidades: `kebab-case.ts`
- Rutas en español (mercado LATAM): `mi-biblioteca`, `casos`, `como-funciona`
- Tablas Supabase: `snake_case` plural

## Cómo escala
- **V1 pasarela:** nuevo directorio `app/(marketing)/comprar/` y `app/api/webhooks/stripe/route.ts`;
  la generación de código deja de ser admin-only y pasa a ser también automática
- **V1 multi-dispositivo:** activar `RealtimeProvider`, sin cambios de estructura
- **V1 más admins:** columna `role` ya existe; solo agregar valores
- **V2 B2B:** migrar a monorepo con Turborepo (`apps/b2c` + `apps/b2b`), reutilizar `lib/`
