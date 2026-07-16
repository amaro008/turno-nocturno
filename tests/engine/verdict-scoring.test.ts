import { describe, it, expect } from 'vitest';
import { scoreVerdict } from '@/lib/engine/verdict-scoring';

describe('scoreVerdict', () => {
  it('puntaje perfecto sin pistas', () => {
    const r = scoreVerdict({ culpritCorrect: true, howScore: 'correcto', whyScore: 'correcto', hintsUsed: 0 });
    expect(r.total).toBe(100);
  });

  it('castiga cada pista', () => {
    const r = scoreVerdict({ culpritCorrect: true, howScore: 'correcto', whyScore: 'correcto', hintsUsed: 2 });
    expect(r.total).toBe(70); // 100 - 2*15
  });

  it('culpable incorrecto reduce a la mitad el cómo/por qué y anula el culpable', () => {
    const r = scoreVerdict({ culpritCorrect: false, howScore: 'correcto', whyScore: 'correcto', hintsUsed: 0 });
    // culpable 0 + how 12.5→13 + why 13 (mitad) = ~25
    expect(r.breakdown.culprit).toBe(0);
    expect(r.total).toBeGreaterThan(0);
    expect(r.total).toBeLessThan(30);
  });

  it('nunca baja de 0', () => {
    const r = scoreVerdict({ culpritCorrect: false, howScore: 'incorrecto', whyScore: 'incorrecto', hintsUsed: 3 });
    expect(r.total).toBe(0);
  });
});
