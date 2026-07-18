// ============================================================================
// Validación de un caso para el banner de estado y el gate de publicación.
// Puro TS (cliente + servidor). Trabaja sobre formas mínimas para evitar ciclos.
// ============================================================================

export interface ValCase {
  cover_image_path: string | null;
  atmosphere_image_path: string | null;
  active: boolean;
}
export interface ValSuspect {
  full_name: string;
  is_victim: boolean;
}
export interface ValEvidence {
  code: string;
  public_description: string;
  initial: boolean;
  unlocked_at_minute: number | null;
  unlocked_by_event_id: string | null;
}
export interface ValVariant {
  code: string;
  active: boolean;
  culprit_suspect_id: string | null;
}

export interface CaseStats {
  suspects: number;
  victims: number;
  evidenceTotal: number;
  evidenceInitial: number;
  evidenceReleased: number;
  evidenceMissingDesc: number;
  variantsActive: number;
  culpritsAssigned: boolean;
  timelineEvents: number;
}

export interface CaseValidation {
  stats: CaseStats;
  blockers: string[]; // impiden publicar (active=true)
  warnings: string[]; // no bloquean
}

// Juicios que no deberían aparecer en una descripción pública.
const VERDICT_WORDS = ['asesino', 'asesina', 'asesin', 'culpable', 'culpó', 'mató', 'homicida', 'homicidio', 'lo hizo', 'responsable del crimen'];

export function validateCase(input: {
  caseRow: ValCase;
  suspects: ValSuspect[];
  evidence: ValEvidence[];
  variants: ValVariant[];
  timelineCount: number;
}): CaseValidation {
  const { caseRow, suspects, evidence, variants, timelineCount } = input;

  const realSuspects = suspects.filter((s) => !s.is_victim);
  const activeVariants = variants.filter((v) => v.active);
  const culpritsAssigned = activeVariants.length > 0 && activeVariants.every((v) => !!v.culprit_suspect_id);
  const missingDesc = evidence.filter((e) => !e.public_description.trim());

  const stats: CaseStats = {
    suspects: realSuspects.length,
    victims: suspects.length - realSuspects.length,
    evidenceTotal: evidence.length,
    evidenceInitial: evidence.filter((e) => e.initial).length,
    evidenceReleased: evidence.filter((e) => !e.initial && (e.unlocked_at_minute != null || e.unlocked_by_event_id)).length,
    evidenceMissingDesc: missingDesc.length,
    variantsActive: activeVariants.length,
    culpritsAssigned,
    timelineEvents: timelineCount,
  };

  const blockers: string[] = [];
  if (!caseRow.cover_image_path) blockers.push('Falta la imagen de portada (cover).');
  if (!caseRow.atmosphere_image_path) blockers.push('Falta la imagen hero (atmósfera).');
  if (activeVariants.length === 0) blockers.push('No hay variantes activas.');
  else if (!culpritsAssigned) blockers.push('Hay variantes activas sin culpable asignado.');
  if (missingDesc.length > 0) blockers.push(`${missingDesc.length} evidencia(s) sin descripción pública: ${missingDesc.map((e) => e.code).join(', ')}.`);
  if (timelineCount === 0) blockers.push('Falta al menos un evento de timeline del Comandante.');

  // Heurística: descripción pública con nombre de sospechoso + juicio.
  const warnings: string[] = [];
  for (const e of evidence) {
    const low = e.public_description.toLowerCase();
    const named = realSuspects.find((s) => s.full_name && low.includes(s.full_name.toLowerCase().split(' ')[0]));
    const judged = VERDICT_WORDS.find((w) => low.includes(w));
    if (named && judged) {
      warnings.push(`La descripción de ${e.code} menciona a "${named.full_name}" y un juicio ("${judged}"). Debe ser neutra.`);
    } else if (judged) {
      warnings.push(`La descripción de ${e.code} usa un término de juicio ("${judged}"). Revísala.`);
    }
  }

  return { stats, blockers, warnings };
}
