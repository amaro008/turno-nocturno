// ============================================================================
// MOTOR — Generador de prompts de IA (puro TS, testeable).
// Combina la dirección de arte del caso con los datos de cada asset para
// producir prompts consistentes, listos para pegar en generadores de imagen/video.
// ============================================================================

import type { ImageSpec } from '@/lib/domain/image-specs';
import { aspectPromptTag } from '@/lib/domain/image-specs';

export interface SuspectPromptInput {
  name: string;
  age?: number | null;
  occupation?: string | null;
  physical_description?: string | null;
  distinctive_features?: string | null;
}

const SUSPECT_NEGATIVE =
  'cartoon, illustration, painting, glamour retouching, perfect skin, model pose, smiling, symmetrical staging';

/** Prompt de retrato de sospechoso. Con `spec` incluye las dimensiones recomendadas. */
export function buildSuspectPrompt(
  s: SuspectPromptInput,
  artDirection: string,
  autoInject = true,
  spec?: ImageSpec,
): string {
  const age = s.age ? `${s.age} year old ` : '';
  const occ = s.occupation ? `${s.occupation}, ` : '';
  const physical = (s.physical_description ?? '').trim() || 'appearance consistent with the case';
  const features = (s.distinctive_features ?? '').trim();
  const style = autoInject && artDirection.trim() ? artDirection.trim() : 'period-accurate photographic style';

  const composition =
    `[COMPOSITION] Medium close-up, 3/4 angle, looking slightly away from camera, subject expression neutral to somber.` +
    (spec?.notes ? ` ${spec.notes}` : '');

  const lines = [`[SUBJECT] Portrait photograph of ${s.name}, ${age}${occ}${physical}.`];
  if (features) {
    lines.push(`[DISTINCTIVE FEATURES] ${features} — these features must be clearly visible.`);
  }
  lines.push(
    `[STYLE] ${style}`,
    composition,
    `[TECHNICAL] Photorealistic, 85mm lens, natural skin texture, sharp focus on face, shallow depth of field.`,
    `[NEGATIVE] ${SUSPECT_NEGATIVE}.`,
    spec ? `[DIMENSIONS] ${aspectPromptTag(spec)} --s 250` : `[ASPECT] --ar 3:4 --s 250`,
  );
  return lines.join('\n');
}

/** Prompt de escena (portada / hero). Con `spec` usa sus dimensiones y notas. */
export function buildScenePrompt(opts: {
  scene: string;
  artDirection: string;
  mood?: string;
  aspect?: string;
  stylize?: number;
  autoInject?: boolean;
  spec?: ImageSpec;
}): string {
  const style = (opts.autoInject ?? true) && opts.artDirection.trim() ? opts.artDirection.trim() : 'cinematic photographic style';
  const mood = opts.mood?.trim() || 'dread, tension, mystery';
  const aspect = opts.spec?.aspectRatio ?? opts.aspect ?? '16:9';
  const s = opts.stylize ?? 400;
  const composition = `[COMPOSITION] Wide establishing shot, cinematic framing.` + (opts.spec?.notes ? ` ${opts.spec.notes}` : '');
  return [
    `[SCENE] ${opts.scene.trim()}`,
    `[STYLE] ${style}`,
    `[MOOD] ${mood}`,
    composition,
    `[TECHNICAL] Photorealistic cinema still, 35mm film grain, anamorphic lens.`,
    opts.spec ? `[DIMENSIONS] ${aspectPromptTag(opts.spec)} --s ${s}` : `[ASPECT] --ar ${aspect} --s ${s}`,
  ].join('\n');
}

export function buildCoverPrompt(scene: string, artDirection: string, autoInject = true, spec?: ImageSpec): string {
  return buildScenePrompt({ scene, artDirection, aspect: '3:4', stylize: 300, autoInject, mood: 'intrigue, foreboding', spec });
}

export function buildHeroPrompt(scene: string, artDirection: string, autoInject = true, spec?: ImageSpec): string {
  return buildScenePrompt({ scene, artDirection, aspect: '16:9', stylize: 400, autoInject, spec });
}

/** Prompt de video de vigilancia. Con `spec` usa su aspecto y rango de duración. */
export function buildVideoPrompt(opts: {
  angle: string;
  location: string;
  event: string;
  eraStyle: string;
  aspect?: string;
  durationSeconds?: number;
  spec?: ImageSpec;
}): string {
  const aspect = opts.spec?.aspectRatio ?? opts.aspect ?? '4:3';
  const duration = opts.spec?.durationSeconds
    ? `${opts.spec.durationSeconds[0]}-${opts.spec.durationSeconds[1]} seconds`
    : `${opts.durationSeconds ?? 6} seconds`;
  return [
    `[SCENE] Security camera footage, ${opts.angle.trim()}, ${opts.location.trim()}.`,
    `[EVENT] ${opts.event.trim()}`,
    `[STYLE] ${opts.eraStyle.trim()}`,
    `[TECHNICAL] ${aspect} aspect ratio, degraded quality, occasional tracking lines.`,
    `[DURATION] ${duration}`,
    `[NEGATIVE] cinematic, professional, color, smooth, modern.`,
    opts.spec ? `[DIMENSIONS] --ar ${aspect} (recommended: ${opts.spec.width}x${opts.spec.height} px)` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
