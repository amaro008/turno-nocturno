import { describe, it, expect } from 'vitest';
import { dueEvents, secondsRemaining, minutesElapsed } from '@/lib/engine/timeline';
import type { TimelineEvent } from '@/lib/domain';

const ev = (id: string, minute: number, variant_scope: string | null = null): TimelineEvent => ({
  id,
  case_id: 'c',
  minute,
  action: 'message',
  payload: {},
  variant_scope,
});

describe('dueEvents', () => {
  const tl = [ev('a', 0), ev('b', 45, 'A'), ev('c', 45, 'B'), ev('d', 75)];

  it('filtra por variante y por minuto, excluye los ya disparados', () => {
    const due = dueEvents(tl, { elapsedMin: 50, variantCode: 'A', firedIds: ['a'] });
    expect(due.map((e) => e.id)).toEqual(['b']); // a ya disparado, c es de B, d aún no vence
  });

  it('incluye eventos globales (variant_scope null)', () => {
    const due = dueEvents(tl, { elapsedMin: 80, variantCode: 'B', firedIds: [] });
    expect(due.map((e) => e.id)).toEqual(['a', 'c', 'd']);
  });
});

describe('secondsRemaining', () => {
  it('nunca es negativo', () => {
    const activated = new Date(Date.now() - 200 * 60000).toISOString();
    expect(secondsRemaining(activated, 150)).toBe(0);
  });
});

describe('minutesElapsed', () => {
  it('calcula minutos desde la activación', () => {
    const activated = new Date(Date.now() - 30 * 60000).toISOString();
    expect(minutesElapsed(activated)).toBe(30);
  });
});
