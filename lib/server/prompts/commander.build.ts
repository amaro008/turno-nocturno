// ============================================================================
// CONSTRUCTOR del system prompt del Comandante para una sesión concreta.
//
// QUÉ SE INCLUYE (autorizado):
//   - Meta del caso (título/ciudad/año, minuto, pistas).
//   - `commanderContext`: la verdad de la variante, redactada por el autor SIN
//      nombrar al culpable.
//   - Ficha PÚBLICA de cada sospechoso (lo mismo que ve el jugador).
//   - `suspect_variant_data` de la variante sorteada: coartada declarada, móvil
//      aparente y notas de comportamiento — para poder responder dudas.
//   - Lista COMPLETA de evidencias (visibles a la variante) con su
//      `public_description` y si está ABIERTA o no (para saber qué existe y qué
//      NO puede revelar antes de tiempo).
//   - Contenido COMPLETO solo de las evidencias YA ABIERTAS.
//
// QUÉ NUNCA SE INCLUYE (prohibido):
//   - `is_culprit_in_variant` de ningún sospechoso.
//   - `variants.culprit` / `culprit_suspect_id` / `solution_narrative`.
//   - `admin_notes` de la evidencia (notas de autor / red herrings).
//   - Contenido de evidencias aún NO abiertas.
// ============================================================================

import { COMMANDER_BASE } from './commander.base';

export interface CommanderSuspect {
  full_name: string;
  occupation: string | null;
  relationship_to_victim: string | null;
  physical_description: string;
  distinctive_features: string;
  // Subset autorizado de suspect_variant_data (NUNCA is_culprit_in_variant):
  alibi_declared: string | null;
  motive_apparent: string | null;
  variant_notes: string | null;
}

export interface CommanderEvidence {
  code: string;
  title: string;
  type: string;
  public_description: string;
  open: boolean;
  /** Contenido solo si `open`. */
  content?: string | null;
}

export interface CommanderState {
  caseTitle: string;
  city: string;
  eraYear: number;
  commanderContext: string; // verdad de la variante, sin revelar culpable
  elapsedMin: number;
  timeLimitMin: number;
  suspects: CommanderSuspect[];
  evidence: CommanderEvidence[];
  hintsUsed: number;
  maxHints: number;
}

function suspectBlock(s: CommanderSuspect): string {
  const lines = [
    `- ${s.full_name}${s.occupation ? ` (${s.occupation})` : ''}${s.relationship_to_victim ? ` — ${s.relationship_to_victim}` : ''}`,
    s.distinctive_features ? `  rasgos: ${s.distinctive_features}` : '',
    s.alibi_declared ? `  coartada declarada: ${s.alibi_declared}` : '',
    s.motive_apparent ? `  móvil aparente: ${s.motive_apparent}` : '',
    s.variant_notes ? `  notas: ${s.variant_notes}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function evidenceBlock(e: CommanderEvidence): string {
  const head = `- ${e.code} [${e.type}] ${e.open ? 'ABIERTA' : 'NO ABIERTA'}: ${e.title} — ${e.public_description}`;
  if (e.open && e.content) return `${head}\n  contenido: ${e.content.slice(0, 600)}`;
  return head;
}

export function buildCommanderSystem(s: CommanderState): string {
  const remaining = Math.max(0, s.timeLimitMin - s.elapsedMin);
  const suspects = s.suspects.length ? s.suspects.map(suspectBlock).join('\n') : '(sin sospechosos)';
  const evidence = s.evidence.length ? s.evidence.map(evidenceBlock).join('\n') : '(sin evidencia)';

  return `${COMMANDER_BASE}

# CASO EN CURSO
Título: ${s.caseTitle}
Ubicación: ${s.city}, ${s.eraYear}
Minuto de sesión: ${s.elapsedMin} de ${s.timeLimitMin} (restan ~${remaining} min)
Pistas usadas: ${s.hintsUsed} de ${s.maxHints}

# VERDAD DEL EXPEDIENTE (tu contexto — nunca reveles el culpable)
${s.commanderContext}

# SOSPECHOSOS (ficha pública + coartada/móvil de ESTA variante)
No sabes cuál es el culpable. Puedes responder sobre coartadas y móviles que constan aquí.
${suspects}

# EVIDENCIA DEL EXPEDIENTE
Las marcadas ABIERTA ya las tienen los detectives. Las NO ABIERTA existen pero
NO puedes revelar su contenido todavía (ni adelantar lo que muestran).
${evidence}

# PISTAS
Si piden una pista y aún les quedan, da una orientación útil pero indirecta,
sin nombrar al culpable. Cada pista descuenta puntaje.`.trim();
}

/** Herramienta lógica de entrega de evidencia a petición (gated por el sistema). */
export const ENVIAR_EVIDENCIA_TOOL = {
  name: 'enviar_evidencia',
  description:
    'Abre a los detectives una pieza de evidencia que exista y esté disponible. ' +
    'Úsala solo si piden algo concreto marcado como disponible. El sistema valida ' +
    'variante y momento: puede rechazarla.',
  input_schema: {
    type: 'object' as const,
    properties: {
      code: { type: 'string' as const, description: 'Código exacto de la evidencia, p. ej. "CINTA-0158".' },
    },
    required: ['code'],
  },
};
