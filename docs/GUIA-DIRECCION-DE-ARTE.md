# GUÍA — Sistema de Dirección de Arte
**Proyecto:** Turno Nocturno · Iteración 3, Fase 3

Manual para producir los assets visuales de un caso de forma consistente, usando prompts de IA.
Todo se administra desde **Admin → Casos → [caso] → Editar → tab "Dirección de Arte"**.

---

## Filosofía
El portal **no genera imágenes en tiempo real**. Cesar produce los assets *offline* con
generadores de imagen (Midjourney, DALL·E 3, Ideogram, Flux) y de video (Kling, Veo, Runway),
copiando prompts bien estructurados desde el admin, y luego **sube el resultado**. El sistema
garantiza **consistencia** inyectando la misma *dirección de arte* del caso en todos los prompts.

## El campo clave: `art_direction`
Una descripción del estilo visual del caso (paleta, iluminación, época, tono). Ejemplo:
> "Fotografía de época noir de los años 40, blanco y negro con grano fino, iluminación dramática
> de claroscuro, atmósfera lluviosa nocturna, paleta desaturada con acentos de rojo carmín."

Con el toggle **"Auto-inyectar"** activado (default), este texto se mete en el bloque `[STYLE]`
de **todos** los prompts del caso (sospechosos, portada, hero, escenas). Cambiarlo y regenerar
mantiene todo coherente.

## Rasgos distintivos = pistas visuales (novedad narrativa)
Cada sospechoso tiene:
- `physical_description` — descripción física neutra (edad, complexión, cabello, ojos, vestimenta).
- `distinctive_features` — **rasgos que pueden ser pistas** (tatuajes, cicatrices, anillos, lentes,
  cojera, prótesis, joyería). **Deben aparecer en la imagen generada** y ser **detectables por
  los jugadores** al abrir la ficha del sospechoso en la consola (sección "Rasgos distintivos"
  con ícono de lupa).
- `image_prompt` — prompt completo, autogenerable con el botón **"Generar prompt"** y editable.

Regla de oro: si un rasgo es pista (p. ej. el anillo de granate que aparece en un VHS), descríbelo
con precisión en `distinctive_features` para que la imagen del retrato y la del video **coincidan**.

## Estructura de los prompts (motor `lib/engine/prompt-builder.ts`)
Función pura y testeable. Plantillas:

**Sospechoso** → `[SUBJECT] [DISTINCTIVE FEATURES] [STYLE] [COMPOSITION] [TECHNICAL] [NEGATIVE] [ASPECT --ar 3:4 --s 250]`
**Portada / hero** → `[SCENE] [STYLE] [MOOD] [COMPOSITION] [TECHNICAL] [ASPECT]`
**Video de vigilancia** → `[SCENE] [EVENT] [STYLE era-specific] [TECHNICAL 4:3] [DURATION] [NEGATIVE]`

## Assets adicionales (`case_visual_prompts`)
Tabla para todo lo demás: escena del crimen, videos VHS por variante, evidencias visuales.
Cada slot tiene `prompt`, `negative_prompt`, `technical_params` (ej. `--ar 16:9 --s 250`),
`reference_notes` (para consistencia entre assets), `status` (pendiente/generado/aprobado) y el
`generated_asset_path` una vez subido.

## Flujo recomendado para un caso nuevo
1. Escribe la **dirección de arte** y guárdala.
2. Completa físico + rasgos de cada **sospechoso** → "Generar prompt" → "Copiar" → genera la
   imagen → "Subir foto generada".
3. Genera **portada** y **hero**; súbelas.
4. Agrega los **slots visuales** (escena, VHS por variante…), copia el prompt completo, genera y sube.
5. Revisa el **checklist** (sección 5): no dejes el caso `active` con assets faltantes.
6. Descarga **`GUIA-DE-ARTE.md`** como respaldo del caso (se guarda en `content/casos/{slug}/`).

## Nota técnica
La generación del archivo `content/casos/{slug}/GUIA-DE-ARTE.md` en runtime no persiste en
el filesystem de Vercel (efímero). Por eso el admin ofrece **"Descargar GUIA-DE-ARTE.md"**
(endpoint `GET /api/admin/cases/[slug]/art-guide`), que arma el Markdown al vuelo desde la BD.
El snapshot versionado del Caso 001 vive en `content/casos/001-ultima-transmision/GUIA-DE-ARTE.md`.
