// ============================================================================
// MOTOR — Puntuación del veredicto (puro TS).
// El acierto del culpable es binario (contra BD). El "cómo" y el "por qué"
// vienen evaluados por la rúbrica (correcto/parcial/incorrecto). Aquí solo
// combinamos y aplicamos el castigo por pistas.
// ============================================================================

import { BASE_SCORE, HINT_PENALTY, VerdictScore } from '@/lib/domain';

const SCORE_VALUE: Record<VerdictScore, number> = {
  correcto: 1,
  parcial: 0.5,
  incorrecto: 0,
};

export interface ScoreInput {
  culpritCorrect: boolean;
  howScore: VerdictScore;
  whyScore: VerdictScore;
  hintsUsed: number;
}

export interface ScoreResult {
  total: number; // 0..100
  breakdown: {
    culprit: number; // 0..50
    how: number; // 0..25
    why: number; // 0..25
    hintPenalty: number; // <= 0
  };
}

/**
 * Reparto: culpable 50, cómo 25, por qué 25. Menos castigo por pistas.
 * Si el culpable es incorrecto, cómo/por qué valen la mitad (razonamiento
 * parcialmente válido apuntando a la persona equivocada).
 */
export function scoreVerdict(input: ScoreInput): ScoreResult {
  const culprit = input.culpritCorrect ? 50 : 0;
  const factor = input.culpritCorrect ? 1 : 0.5;
  const how = Math.round(25 * SCORE_VALUE[input.howScore] * factor);
  const why = Math.round(25 * SCORE_VALUE[input.whyScore] * factor);
  const hintPenalty = -Math.min(BASE_SCORE, input.hintsUsed * HINT_PENALTY);

  const total = Math.max(0, Math.min(BASE_SCORE, culprit + how + why + hintPenalty));

  return {
    total,
    breakdown: { culprit, how, why, hintPenalty },
  };
}
