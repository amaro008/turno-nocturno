// ============================================================================
// Registro central de especificaciones de imagen (fuente de verdad).
// Todo uploader y todo prompt de IA consume estas specs. Sin imports de servidor.
// ============================================================================

export type CropBehavior = 'cover' | 'contain' | 'fixed';

export type ImageSpec = {
  slot: string;
  label: string;
  width: number;
  height: number;
  aspectRatio: string; // "16:9", "3:4", "1:1"
  minWidth: number;
  maxSizeMB: number;
  formats: string[]; // ["jpg","png","webp"]
  usage: string;
  cropBehavior: CropBehavior;
  durationSeconds?: [number, number]; // solo video
  notes?: string;
};

export const IMAGE_SPECS: Record<string, ImageSpec> = {
  // ---- Assets del sitio ----
  'landing.hero': {
    slot: 'landing.hero', label: 'Hero del landing', width: 2400, height: 1200, aspectRatio: '16:9',
    minWidth: 1600, maxSizeMB: 0.5, formats: ['jpg', 'webp'], cropBehavior: 'cover',
    usage: 'Fondo hero principal del landing, full-bleed.',
    notes: 'Atención en el tercio inferior, donde va el copy.',
  },
  'landing.how_step_1': {
    slot: 'landing.how_step_1', label: 'Paso 1', width: 1200, height: 900, aspectRatio: '4:3',
    minWidth: 800, maxSizeMB: 0.3, formats: ['jpg', 'webp'], cropBehavior: 'cover',
    usage: 'Ilustración de paso del proceso, dentro de un folder manila.',
  },
  'landing.how_step_2': {
    slot: 'landing.how_step_2', label: 'Paso 2', width: 1200, height: 900, aspectRatio: '4:3',
    minWidth: 800, maxSizeMB: 0.3, formats: ['jpg', 'webp'], cropBehavior: 'cover',
    usage: 'Ilustración de paso del proceso, dentro de un folder manila.',
  },
  'landing.how_step_3': {
    slot: 'landing.how_step_3', label: 'Paso 3', width: 1200, height: 900, aspectRatio: '4:3',
    minWidth: 800, maxSizeMB: 0.3, formats: ['jpg', 'webp'], cropBehavior: 'cover',
    usage: 'Ilustración de paso del proceso, dentro de un folder manila.',
  },
  'landing.testimonial_1_avatar': {
    slot: 'landing.testimonial_1_avatar', label: 'Avatar testimonio 1', width: 400, height: 400, aspectRatio: '1:1',
    minWidth: 240, maxSizeMB: 0.15, formats: ['jpg', 'webp', 'png'], cropBehavior: 'cover',
    usage: 'Avatar circular del testimonio.',
  },
  'landing.testimonial_2_avatar': {
    slot: 'landing.testimonial_2_avatar', label: 'Avatar testimonio 2', width: 400, height: 400, aspectRatio: '1:1',
    minWidth: 240, maxSizeMB: 0.15, formats: ['jpg', 'webp', 'png'], cropBehavior: 'cover',
    usage: 'Avatar circular del testimonio.',
  },
  'landing.testimonial_3_avatar': {
    slot: 'landing.testimonial_3_avatar', label: 'Avatar testimonio 3', width: 400, height: 400, aspectRatio: '1:1',
    minWidth: 240, maxSizeMB: 0.15, formats: ['jpg', 'webp', 'png'], cropBehavior: 'cover',
    usage: 'Avatar circular del testimonio.',
  },
  'catalog.empty_state': {
    slot: 'catalog.empty_state', label: 'Estado vacío del catálogo', width: 800, height: 800, aspectRatio: '1:1',
    minWidth: 400, maxSizeMB: 0.2, formats: ['jpg', 'webp', 'png'], cropBehavior: 'contain',
    usage: 'Ilustración cuando no hay casos con los filtros.',
  },
  'como_funciona.hero': {
    slot: 'como_funciona.hero', label: 'Imagen de "Cómo funciona"', width: 2400, height: 1000, aspectRatio: '12:5',
    minWidth: 1600, maxSizeMB: 0.5, formats: ['jpg', 'webp'], cropBehavior: 'cover',
    usage: 'Encabezado de la página /como-funciona.',
  },
  'about.team_photo': {
    slot: 'about.team_photo', label: 'Foto del equipo', width: 1600, height: 900, aspectRatio: '16:9',
    minWidth: 1000, maxSizeMB: 0.4, formats: ['jpg', 'webp'], cropBehavior: 'cover',
    usage: 'Foto del equipo en la página Nosotros.',
  },

  // ---- Casos ----
  'case.cover': {
    slot: 'case.cover', label: 'Portada de caso', width: 800, height: 1200, aspectRatio: '2:3',
    minWidth: 600, maxSizeMB: 0.4, formats: ['jpg', 'webp'], cropBehavior: 'cover',
    usage: 'Ficha en el muro de investigación del catálogo y en la biblioteca del usuario.',
    notes: 'Composición vertical (póster); elemento central visible con márgenes de 8% arriba y abajo para que el clip decorativo no cubra información.',
  },
  'case.hero': {
    slot: 'case.hero', label: 'Hero del caso', width: 2400, height: 1000, aspectRatio: '12:5',
    minWidth: 1600, maxSizeMB: 0.5, formats: ['jpg', 'webp'], cropBehavior: 'cover',
    usage: 'Imagen atmosférica en el detalle del caso público (sin sospechosos ni víctima).',
    notes: 'Composición panorámica, foco en la atmósfera del lugar.',
  },

  // ---- Sospechosos ----
  'suspect.portrait': {
    slot: 'suspect.portrait', label: 'Retrato de sospechoso', width: 800, height: 1067, aspectRatio: '3:4',
    minWidth: 600, maxSizeMB: 0.3, formats: ['jpg', 'png'], cropBehavior: 'cover',
    usage: 'Ficha del sospechoso y grid del briefing/expediente.',
    notes: 'Encuadre medio-corto, cara en el tercio superior, hombros visibles. Los rasgos distintivos DEBEN quedar dentro del encuadre (tatuajes de cuello, cicatrices, lentes). Fondo neutro tipo estudio. Sujeto mirando ligeramente a un lado, expresión neutra o sombría. NO pose de modelo, NO sonrisa.',
  },

  // ---- Evidencia visual ----
  'evidence.document': {
    slot: 'evidence.document', label: 'Documento (evidencia)', width: 1200, height: 1600, aspectRatio: '3:4',
    minWidth: 900, maxSizeMB: 0.4, formats: ['jpg', 'png', 'webp'], cropBehavior: 'contain',
    usage: 'Foto o escaneo de documento en el visor del expediente.',
  },
  'evidence.photo': {
    slot: 'evidence.photo', label: 'Foto de evidencia', width: 1600, height: 1200, aspectRatio: '4:3',
    minWidth: 1000, maxSizeMB: 0.4, formats: ['jpg', 'png', 'webp'], cropBehavior: 'cover',
    usage: 'Fotografía de evidencia (objeto, escenario, huella).',
  },
  'evidence.vhs_still': {
    slot: 'evidence.vhs_still', label: 'Frame de VHS', width: 1280, height: 960, aspectRatio: '4:3',
    minWidth: 800, maxSizeMB: 0.35, formats: ['jpg', 'webp'], cropBehavior: 'cover',
    usage: 'Portada del video VHS en el listado (no es el video).',
  },

  // ---- Video (para el prompt del generador) ----
  'video.vhs_clip': {
    slot: 'video.vhs_clip', label: 'Clip VHS', width: 1280, height: 960, aspectRatio: '4:3',
    minWidth: 960, maxSizeMB: 15, formats: ['mp4'], cropBehavior: 'cover', durationSeconds: [6, 8],
    usage: 'Video VHS de vigilancia.',
    notes: 'Aspecto 4:3 obligatorio, grano de VHS pesado, timestamp quemado en overlay.',
  },
};

export function getSpec(slot: string): ImageSpec | undefined {
  return IMAGE_SPECS[slot];
}

/** Número del aspect ("3:4" → 0.75). */
export function aspectRatioValue(aspectRatio: string): number {
  const [w, h] = aspectRatio.split(':').map(Number);
  return h ? w / h : 1;
}

/** Fragmento para pegar en prompts de IA: `--ar 3:4 (recommended: 800x1067 px)`. */
export function aspectPromptTag(spec: ImageSpec): string {
  return `--ar ${spec.aspectRatio} (recommended: ${spec.width}x${spec.height} px)`;
}

/** String corto para el botón "Copiar dimensiones para IA". */
export function copyDimsString(spec: ImageSpec): string {
  return `--ar ${spec.aspectRatio} (${spec.width}x${spec.height})`;
}
