// ============================================================================
// CONSTRUCTOR del system prompt del Comandante para una sesión concreta.
// Compone: base + contexto de la variante (SIN culpable) + estado de la sesión
// (minuto, evidencia ya entregada, pistas usadas).
// ============================================================================

import { COMMANDER_BASE } from './commander.base';

export interface CommanderState {
  caseTitle: string;
  city: string;
  eraYear: number;
  commanderContext: string; // verdad de la variante, redactada sin revelar culpable
  elapsedMin: number;
  timeLimitMin: number;
  deliveredEvidence: { code: string; title: string }[];
  deliverableEvidence: { code: string; title: string }[]; // aún no entregada pero disponible
  hintsUsed: number;
  maxHints: number;
}

export function buildCommanderSystem(s: CommanderState): string {
  const remaining = Math.max(0, s.timeLimitMin - s.elapsedMin);

  const delivered =
    s.deliveredEvidence.length > 0
      ? s.deliveredEvidence.map((e) => `- ${e.code}: ${e.title}`).join('\n')
      : '(ninguna todavía)';

  const deliverable =
    s.deliverableEvidence.length > 0
      ? s.deliverableEvidence.map((e) => `- ${e.code}: ${e.title}`).join('\n')
      : '(ninguna disponible en este momento)';

  return `${COMMANDER_BASE}

# CASO EN CURSO
Título: ${s.caseTitle}
Ubicación: ${s.city}, ${s.eraYear}
Minuto de sesión: ${s.elapsedMin} de ${s.timeLimitMin} (restan ~${remaining} min)
Pistas usadas: ${s.hintsUsed} de ${s.maxHints}

# VERDAD DEL EXPEDIENTE (tu contexto — nunca reveles el culpable)
${s.commanderContext}

# EVIDENCIA YA ENTREGADA A LOS DETECTIVES
${delivered}

# EVIDENCIA QUE PUEDES SOLICITAR AL ARCHIVO (si la piden y encaja)
Usa 'enviar_evidencia' con el código exacto. El sistema valida disponibilidad.
${deliverable}

# PISTAS
Si piden una pista y aún les quedan, da una orientación útil pero indirecta,
sin nombrar al culpable. Recuerda que cada pista les descuenta puntaje.`.trim();
}

/** Definición de la herramienta lógica de entrega de evidencia. */
export const ENVIAR_EVIDENCIA_TOOL = {
  name: 'enviar_evidencia',
  description:
    'Solicita al archivo que entregue una pieza de evidencia a los detectives. ' +
    'Úsala solo cuando pidan algo concreto que exista en la lista de evidencia disponible. ' +
    'El sistema valida variante, minuto y prerequisitos: puede rechazarla.',
  input_schema: {
    type: 'object' as const,
    properties: {
      code: {
        type: 'string' as const,
        description: 'Código exacto de la evidencia, p. ej. "CINTA-0158".',
      },
    },
    required: ['code'],
  },
};
