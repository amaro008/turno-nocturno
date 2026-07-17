// ============================================================================
// MOTOR — Generador de prompts de IA (puro TS, testeable).
// Combina la dirección de arte del caso con los datos de cada asset para
// producir prompts consistentes, listos para pegar en generadores de imagen/video.
// ============================================================================

export interface SuspectPromptInput {
  name: string;
  age?: number | null;
  occupation?: string | null;
  physical_description?: string | null;
  distinctive_features?: string | null;
}

const SUSPECT_NEGATIVE =
  'cartoon, illustration, painting, glamour retouching, perfect skin, model pose, smiling, symmetrical staging';

/** Prompt de retrato de sospechoso (--ar 3:4). */
export function buildSuspectPrompt(s: SuspectPromptInput, artDirection: string, autoInject = true): string {
  const age = s.age ? `${s.age} year old ` : '';
  const occ = s.occupation ? `${s.occupation}, ` : '';
  const physical = (s.physical_description ?? '').trim() || 'appearance consistent with the case';
  const features = (s.distinctive_features ?? '').trim();
  const style = autoInject && artDirection.trim() ? artDirection.trim() : 'period-accurate photographic style';

  const lines = [
    `[SUBJECT] Portrait photograph of ${s.name}, ${age}${occ}${physical}.`,
  ];
  if (features) {
    lines.push(`[DISTINCTIVE FEATURES] ${features} — these features must be clearly visible.`);
  }
  lines.push(
    `[STYLE] ${style}`,
    `[COMPOSITION] Medium close-up, 3/4 angle, looking slightly away from camera, subject expression neutral to somber.`,
    `[TECHNICAL] Photorealistic, 85mm lens, natural skin texture, sharp focus on face, shallow depth of field.`,
    `[NEGATIVE] ${SUSPECT_NEGATIVE}.`,
    `[ASPECT] --ar 3:4 --s 250`,
  );
  return lines.join('\n');
}

/** Prompt de escena (portada / hero). */
export function buildScenePrompt(opts: {
  scene: string;
  artDirection: string;
  mood?: string;
  aspect?: string;
  stylize?: number;
  autoInject?: boolean;
}): string {
  const style = (opts.autoInject ?? true) && opts.artDirection.trim() ? opts.artDirection.trim() : 'cinematic photographic style';
  const mood = opts.mood?.trim() || 'dread, tension, mystery';
  const aspect = opts.aspect ?? '16:9';
  const s = opts.stylize ?? 400;
  return [
    `[SCENE] ${opts.scene.trim()}`,
    `[STYLE] ${style}`,
    `[MOOD] ${mood}`,
    `[COMPOSITION] Wide establishing shot, cinematic framing.`,
    `[TECHNICAL] Photorealistic cinema still, 35mm film grain, anamorphic lens.`,
    `[ASPECT] --ar ${aspect} --s ${s}`,
  ].join('\n');
}

export function buildCoverPrompt(scene: string, artDirection: string, autoInject = true): string {
  return buildScenePrompt({ scene, artDirection, aspect: '3:4', stylize: 300, autoInject, mood: 'intrigue, foreboding' });
}

export function buildHeroPrompt(scene: string, artDirection: string, autoInject = true): string {
  return buildScenePrompt({ scene, artDirection, aspect: '16:9', stylize: 400, autoInject });
}

/** Prompt de video de vigilancia. */
export function buildVideoPrompt(opts: {
  angle: string;
  location: string;
  event: string;
  eraStyle: string;
  aspect?: string;
  durationSeconds?: number;
}): string {
  return [
    `[SCENE] Security camera footage, ${opts.angle.trim()}, ${opts.location.trim()}.`,
    `[EVENT] ${opts.event.trim()}`,
    `[STYLE] ${opts.eraStyle.trim()}`,
    `[TECHNICAL] ${opts.aspect ?? '4:3'} aspect ratio, degraded quality, occasional tracking lines.`,
    `[DURATION] ${opts.durationSeconds ?? 6} seconds`,
    `[NEGATIVE] cinematic, professional, color, smooth, modern.`,
  ].join('\n');
}
