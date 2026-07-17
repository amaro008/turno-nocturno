# Guía de Arte — La Última Transmisión
**Caso:** `001-ultima-transmision` · Monterrey 1989

> Snapshot de los prompts de IA del caso (imágenes de sospechosos, portada, hero,
> escena y videos VHS). Se regenera desde **Admin → Casos → Dirección de Arte →
> "Descargar GUIA-DE-ARTE.md"**. Pégalos en Midjourney / DALL·E 3 / Ideogram / Flux
> (imágenes) o Kling / Veo / Runway (video).

## Dirección de arte del caso
Fotografía documental de época, Monterrey 1989. Estética noir televisiva de finales de los 80:
grano de película 35mm, iluminación tungsteno cálida y sombras duras de claroscuro, paleta
desaturada verde-ámbar con negros profundos y un único acento de rojo carmín. Atmósfera
nocturna, húmeda, de estación de radio. Realismo fotográfico, nada estilizado ni glamouroso.

*Auto-inyección del estilo en todos los prompts: activada.*

## Portada del caso (--ar 3:4)
```
[SCENE] Cabina de radio a oscuras, micrófono de pedestal volcado sobre la consola, luz roja de "AL AIRE" apagada, cinta de casete desenrollada.
[STYLE] Fotografía documental de época noir, Monterrey 1989, grano 35mm, claroscuro tungsteno, paleta verde-ámbar desaturada con acento carmín.
[MOOD] intriga, presagio, silencio después del corte
[COMPOSITION] Wide establishing shot, cinematic framing.
[TECHNICAL] Photorealistic cinema still, 35mm film grain, anamorphic lens.
[ASPECT] --ar 3:4 --s 300
```

## Imagen hero (--ar 16:9)
```
[SCENE] Exterior nocturno de la estación Radio Norte bajo lluvia fina, letrero de neón parpadeante, un auto solitario con los faros encendidos frente a la entrada.
[STYLE] ...noir Monterrey 1989...
[MOOD] dread, tension, mystery
[COMPOSITION] Wide establishing shot, cinematic framing.
[TECHNICAL] Photorealistic cinema still, 35mm film grain, anamorphic lens.
[ASPECT] --ar 16:9 --s 400
```

## Sospechosos (retratos --ar 3:4)
Cada retrato **debe** mostrar el rasgo distintivo (es pista detectable en el expediente).

| Sospechoso | Rasgo distintivo (pista) |
|---|---|
| **Marcos Treviño** (ingeniero) | Cicatriz vertical en ceja derecha · reloj plateado grande (muñeca izq., visible al cargar el trofeo en variante A) |
| **Elena Vidal** (productora) | Anillo de plata con piedra granate (mano izq.) — aparece en VHS-lobby-B al cerrar la puerta |
| **Fernando Ibarra** (dueño) | Anillo de graduación Yale (mano der.) — aparece en el acceso del patio en variante C |
| **Silvia Rentería** (telefonista) | Lentes de pasta negra · nictalopía documentada (no puede manejar de noche → desmiente su coartada) |
| **Joaquín "El Cuervo" Peña** (locatario) | Tatuaje de cuervo mal hecho en el cuello · falta el dedo anular izq. — su ausencia en los VHS lo exonera en variante C |
| **Beatriz Campos** (recepcionista) | Collar con dije de foto del hermano fallecido — caracterización, **no** es pista |

**Víctima — Rodrigo Salazar (locutor):** tatuaje de un búho en el antebrazo izquierdo (su alias
al aire). Caracterización, no es pista. Ver slot `victim_portrait`.

> Los prompts completos por sospechoso viven en la BD (`suspects.image_prompt`) y se
> regeneran con el botón **"Generar prompt"** (combina físico + rasgos + dirección de arte).

## Assets adicionales (`case_visual_prompts`)
- `scene_of_crime` (imagen 16:9) — hallazgo en la cabina, sin cuerpo.
- `victim_portrait` (imagen 3:4) — retrato de Salazar con el tatuaje del búho.
- `vhs_pasillo_a` (video 4:3, variante A) — figura beige 02:29 / 02:41.
- `vhs_lobby_a` (video 4:3, variante A) — salida 02:52, reloj plateado visible.
- `vhs_lobby_b` (video 4:3, variante B) — salida 01:20 / regreso 01:45; **anillo granate** al cerrar la puerta.
- `vhs_pasillo_b` (video 4:3, variante B) — ingeniero saliendo 02:33 (red herring que lo exonera).

Ejemplo de prompt de video (VHS-lobby-B, la pista clave):
```
[SCENE] Security camera footage, fixed angle over the lobby entrance of Radio Norte.
[EVENT] 01:20 la productora sale; 01:45 regresa; al cerrar la puerta la mano izquierda queda a cuadro.
[STYLE] 1989 VHS security camera, low resolution, timestamp overlay 27/10/1989 01:45:22, fixed angle, no audio, black and white with heavy grain.
[TECHNICAL] 4:3 aspect ratio, degraded quality, occasional tracking lines.
[DURATION] 6 seconds
[NEGATIVE] cinematic, professional, color, smooth, modern
```
