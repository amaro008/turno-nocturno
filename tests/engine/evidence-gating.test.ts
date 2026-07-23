import { describe, it, expect } from 'vitest';
import { openReason, isOpen, visibleForVariant, canOpen } from '@/lib/engine/evidence-gating';
import type { EvidenceBase } from '@/lib/domain';

const base = (over: Partial<EvidenceBase>): EvidenceBase => ({
  id: over.id ?? 'id-' + (over.code ?? 'x'),
  case_id: 'case-1',
  code: over.code ?? 'X',
  title: over.title ?? 'T',
  type: over.type ?? 'document',
  scope: over.scope ?? 'shared',
  variant_id: over.variant_id ?? null,
  initial: over.initial ?? false,
  is_report: over.is_report ?? false,
  unlocked_at_minute: over.unlocked_at_minute ?? null,
  unlocked_by_event_id: over.unlocked_by_event_id ?? null,
  public_description: over.public_description ?? '',
  admin_notes: over.admin_notes ?? '',
});

const ctx = { variantId: 'A', elapsedMin: 40, firedEventIds: ['ev-1'], unlockedCodes: ['MANUAL'] };

describe('openReason', () => {
  it('abre la evidencia inicial desde el minuto 0', () => {
    expect(openReason(base({ code: 'INI', initial: true }), { ...ctx, elapsedMin: 0 })).toBe('initial');
  });
  it('abre por tiempo cuando transcurre el minuto', () => {
    expect(openReason(base({ code: 'T30', unlocked_at_minute: 30 }), ctx)).toBe('time');
    expect(openReason(base({ code: 'T60', unlocked_at_minute: 60 }), ctx)).toBeNull();
  });
  it('abre por evento del Comandante disparado', () => {
    expect(openReason(base({ code: 'EV', unlocked_by_event_id: 'ev-1' }), ctx)).toBe('event');
    expect(openReason(base({ code: 'EV2', unlocked_by_event_id: 'ev-9' }), ctx)).toBeNull();
  });
  it('abre por desbloqueo manual (código)', () => {
    expect(openReason(base({ code: 'MANUAL' }), ctx)).toBe('manual');
  });
  it('nunca abre evidencia de otra variante', () => {
    const e = base({ code: 'VB', scope: 'variant', variant_id: 'B', initial: true });
    expect(isOpen(e, ctx)).toBe(false);
  });
});

describe('visibleForVariant', () => {
  it('incluye shared y la variante sorteada, excluye otras variantes', () => {
    const cat = [
      base({ code: 'S', scope: 'shared' }),
      base({ code: 'A1', scope: 'variant', variant_id: 'A' }),
      base({ code: 'B1', scope: 'variant', variant_id: 'B' }),
    ];
    expect(visibleForVariant(cat, 'A').map((e) => e.code)).toEqual(['S', 'A1']);
  });
});

describe('canOpen', () => {
  const cat = [
    base({ code: 'INI', initial: true }),
    base({ code: 'T60', unlocked_at_minute: 60 }),
    base({ code: 'EV', unlocked_by_event_id: 'ev-1' }),
  ];
  it('rechaza inexistente y de otra variante', () => {
    expect(canOpen('NOPE', cat, ctx)).toEqual({ ok: false, reason: 'not_found' });
  });
  it('rechaza pieza futura por tiempo, salvo viaEvent', () => {
    expect(canOpen('T60', cat, ctx).ok).toBe(false);
    expect(canOpen('EV', cat, ctx).ok).toBe(false);
    expect(canOpen('EV', cat, ctx, true).ok).toBe(true);
  });
  it('abre la inicial', () => {
    expect(canOpen('INI', cat, ctx).ok).toBe(true);
  });
});
