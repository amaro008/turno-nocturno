# CASO-PILOTO — Caso 001: "La Última Transmisión"
**Proyecto:** Turno Nocturno · **Versión:** 0.4 — 16/jul/2026 · **Estado:** Borrador
**Relacionado con:** DATA-MODEL.md, PROJECT-STRUCTURE.md

---

## Ubicación en el repo
`content/casos/001-ultima-transmision/`

## Posición en la serie
Caso 001 de la serie de ciudades icónicas: **Monterrey, 1989**. Los siguientes casos cambian
de ciudad y época (candidatos V1: CDMX años 50, Guadalajara 2004, Mérida 1972…). Cada caso
declara `city`, `era_year`, `era_profile` y debe pasar el checklist de época antes de producción.

## Checklist de época (obligatorio, ejemplo 1989)
- Comunicación: teléfono fijo, casetas, telegramas, radio; SIN celulares/internet
- Evidencia técnica plausible: cassettes, VHS, rollos térmicos, registros Telmex en papel
- Forense: SIN ADN; tipo de sangre, huellas, fibras
- Lenguaje y precios de la época (viejos pesos)
- Perfil post-fx: `vhs-80s` + `telefono-analogico`

## Marco narrativo
Los jugadores son detectives de HOY. La Fiscalía reabre el expediente 89-1027-H y el
Comandante los contacta por mensajería para conducir la reapertura. Evidencia de época,
conducción moderna. Justifica "peritajes modernos" dosificados como eventos temporales.

## Variantes (el modelo soporta 3; el piloto produce A y B, C queda diseñada)

### VARIANTE A — Culpable: MARCOS TREVIÑO (ingeniero)
- Móvil: vendía cassettes pirata de llamadas confidenciales; Rodrigo iba a exponerlo a las 03:00
- Se rompe con: modulador-A (sin falla + ajuste 02:31 interior), bitácora vigilante 02:28,
  VHS-pasillo-A (figura beige 02:29/02:41), fibras beige en mano del occiso
- Pivotes A: modulador-A, VHS-pasillo-A, INT-TREV-A, forense-A

### VARIANTE B — Culpable: ELENA VIDAL (productora)
- Móvil: ella operaba el negocio de cassettes; el locatario de Audio Rey es su primo;
  la "rata" era ella
- Se rompe con: ticket-B (01:26 vs su declaración de salir 02:10), VHS-lobby-B (sale 01:20,
  regresa 01:45), fibras guinda, locatario-B ("una señorita mandaba los encargos"),
  modulador-B (registra falla real 02:05-02:55 → exonera a Treviño)
- Red herring fuerte: Treviño (VHS-pasillo-B lo regresa a las 02:33)
- Pivotes B: ticket-B, VHS-lobby-B, VHS-pasillo-B, modulador-B, forense-B, locatario-B

### VARIANTE C (diseñada, no producida en MVP) — Culpable: FERNANDO IBARRA (dueño)
- Móvil: seguro de "talento clave" de 500 millones; Rodrigo iba a revelar fraude contable
- Mecánica: llamada de 02:35 "desde su casa" la hizo su socio; Ibarra volvió por el acceso
  del patio no vigilado durante el box
- Pivotes C: registro-telmex-C, declaración-socio-C, bitácora-vigilante-C, VHS-lobby-C, forense-C

## Eventos temporales del Caso 001 (default 150 min)
| min | acción | payload (resumen) |
|-----|--------|-------------------|
| 0   | voice + evidence | briefing + adjuntos iniciales (parte, fichas, croquis) |
| 45  | evidence | "peritaje moderno" — evidencia de profundidad según variante |
| 75  | voice | pide línea de investigación; sugiere revisar documentos si 20 min sin actividad |
| 105 | message + voice | presión del MP; micro-pista si 0 evidencias pivote abiertas |
| 135 | voice | ultimátum |
| 150 | pressure | exige veredicto; reloj a 0 |

## Producción de medios
- Audios compartidos (3): CINTA-0158, TEL-0223, EMERG-0249
- Audios por variante (2×2 = 4): interrogatorio pivote + resolución narrada
- Notas de voz del Comandante (6, una sola voz): briefing + 3 eventos + 2 resoluciones
- Videos por variante (2×2 = 4): VHS-lobby y VHS-pasillo
- Documentos: HTML/imagen en portal

## Matriz de validación evidencia × variante
`content/casos/001-ultima-transmision/matriz-validacion.md` — obligatoria antes de producir
medios. Filas = evidencias, columnas = A/B/C. Cero contradicciones. Se versiona con el caso.

## Precio referencial (informativo en MVP, sin pasarela)
`cases.price_mxn = 399` (referencia interna del piloto; el admin puede cobrar lo que quiera).

## Dirección de arte y rasgos distintivos (Iteración 3, Fase 3)
**Dirección de arte:** fotografía documental noir, Monterrey 1989 — grano 35mm, claroscuro
tungsteno, paleta verde-ámbar desaturada con acento carmín. (Ver
`content/casos/001-ultima-transmision/GUIA-DE-ARTE.md` para todos los prompts.)

**Roster de sospechosos ampliado a 6** (antes 3). Cada uno tiene un rasgo distintivo que puede
ser pista y debe verse en su imagen:

| Sospechoso | Ocupación | Rasgo distintivo (pista) |
|---|---|---|
| Marcos Treviño | ingeniero | cicatriz en ceja derecha · reloj plateado (visible al cargar el trofeo, var. A) |
| Elena Vidal | productora | anillo de plata con granate (mano izq.) — visible en VHS-lobby-B al cerrar la puerta |
| Fernando Ibarra | dueño | anillo de graduación Yale — visible en el acceso del patio, var. C |
| Silvia Rentería | telefonista | lentes de pasta negra · nictalopía (no maneja de noche → cae su coartada) |
| Joaquín "El Cuervo" Peña | locatario | tatuaje de cuervo mal hecho · falta dedo anular izq. — su ausencia en los VHS lo exonera (var. C) |
| Beatriz Campos | recepcionista | collar con dije de foto — caracterización, **no** es pista |

**Víctima Rodrigo Salazar:** tatuaje de búho en el antebrazo izquierdo (alias al aire) —
caracterización. Prompt en el slot `victim_portrait`.

**Assets visuales (`case_visual_prompts`):** `scene_of_crime`, `victim_portrait`, y los 4 VHS
(`vhs_pasillo_a`, `vhs_lobby_a`, `vhs_lobby_b`, `vhs_pasillo_b`) — 2 por variante.
