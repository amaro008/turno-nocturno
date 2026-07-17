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
5. Consulta la **Referencia de tamaños** (sección 5 del tab) para cada asset antes de generar.
6. Revisa el **checklist** (sección 6): no dejes el caso `active` con assets faltantes.
7. Descarga **`GUIA-DE-ARTE.md`** como respaldo del caso (se guarda en `content/casos/{slug}/`).

## Tamaños de imagen (fuente de verdad)
Todas las dimensiones esperadas viven en un registro central, **`lib/domain/image-specs.ts`**
(`IMAGE_SPECS`). Cada uploader del sitio muestra un **panel de especificaciones** (dimensiones,
proporción, peso máximo, formatos, notas) y un botón **"Copiar dimensiones para IA"** que copia
algo como `--ar 3:4 (800x1067)` al portapapeles. Al soltar una imagen fuera de spec, el uploader:

- **Avisa** (no bloquea) si el ancho es menor al mínimo → puede verse borrosa.
- **Avisa** si la proporción difiere >5% del objetivo → ofrece **"Recortar y subir"** (recorte
  centrado al aspecto correcto) o **"Subir así"**.
- **Comprime** automáticamente si pesa más del máximo.

Los prompts autogenerados incluyen las dimensiones al final, en un bloque
`[DIMENSIONS] --ar 3:4 (recommended: 800x1067 px) --s 250`.

| Asset | Slot | Dimensiones | Proporción | Ancho mín | Peso máx | Formatos |
| --- | --- | --- | --- | --- | --- | --- |
| Hero del landing | `landing.hero` | 2400×1200 px | 16:9 | 1600 px | 512 KB | JPG, WEBP |
| Paso 1 | `landing.how_step_1` | 1200×900 px | 4:3 | 800 px | 307 KB | JPG, WEBP |
| Paso 2 | `landing.how_step_2` | 1200×900 px | 4:3 | 800 px | 307 KB | JPG, WEBP |
| Paso 3 | `landing.how_step_3` | 1200×900 px | 4:3 | 800 px | 307 KB | JPG, WEBP |
| Avatar testimonio 1 | `landing.testimonial_1_avatar` | 400×400 px | 1:1 | 240 px | 154 KB | JPG, WEBP, PNG |
| Avatar testimonio 2 | `landing.testimonial_2_avatar` | 400×400 px | 1:1 | 240 px | 154 KB | JPG, WEBP, PNG |
| Avatar testimonio 3 | `landing.testimonial_3_avatar` | 400×400 px | 1:1 | 240 px | 154 KB | JPG, WEBP, PNG |
| Estado vacío del catálogo | `catalog.empty_state` | 800×800 px | 1:1 | 400 px | 205 KB | JPG, WEBP, PNG |
| Imagen de "Cómo funciona" | `como_funciona.hero` | 2400×1000 px | 12:5 | 1600 px | 512 KB | JPG, WEBP |
| Foto del equipo | `about.team_photo` | 1600×900 px | 16:9 | 1000 px | 410 KB | JPG, WEBP |
| Portada de caso | `case.cover` | 800×1200 px | 2:3 | 600 px | 410 KB | JPG, WEBP |
| Hero del caso | `case.hero` | 2400×1000 px | 12:5 | 1600 px | 512 KB | JPG, WEBP |
| Retrato de sospechoso | `suspect.portrait` | 800×1067 px | 3:4 | 600 px | 307 KB | JPG, PNG |
| Documento (evidencia) | `evidence.document` | 1200×1600 px | 3:4 | 900 px | 410 KB | JPG, PNG, WEBP |
| Foto de evidencia | `evidence.photo` | 1600×1200 px | 4:3 | 1000 px | 410 KB | JPG, PNG, WEBP |
| Frame de VHS | `evidence.vhs_still` | 1280×960 px | 4:3 | 800 px | 358 KB | JPG, WEBP |
| Clip VHS | `video.vhs_clip` | 1280×960 px | 4:3 | 960 px | 15 MB | MP4 · 6–8 s |

> Para cambiar un tamaño, edita **solo** `lib/domain/image-specs.ts`: uploaders, paneles,
> prompts, tabla del tab "Dirección de Arte" y la guía descargable se actualizan solos.

## Nota técnica
La generación del archivo `content/casos/{slug}/GUIA-DE-ARTE.md` en runtime no persiste en
el filesystem de Vercel (efímero). Por eso el admin ofrece **"Descargar GUIA-DE-ARTE.md"**
(endpoint `GET /api/admin/cases/[slug]/art-guide`), que arma el Markdown al vuelo desde la BD.
El snapshot versionado del Caso 001 vive en `content/casos/001-ultima-transmision/GUIA-DE-ARTE.md`.
