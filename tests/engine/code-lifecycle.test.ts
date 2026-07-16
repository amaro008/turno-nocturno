import { describe, it, expect } from 'vitest';
import { computeCodeTiming, canActivate, canRedeem, generateAccessCode } from '@/lib/engine/code-lifecycle';

const H = 60 * 60 * 1000;
const D = 24 * H;

describe('computeCodeTiming', () => {
  it('usa la ventana de canje (24h desde sent_at) si no está activado', () => {
    const now = new Date('2026-07-16T12:00:00Z');
    const t = computeCodeTiming(
      { created_at: '2026-07-16T00:00:00Z', sent_at: '2026-07-16T00:00:00Z', activated_at: null, status: 'sent' },
      now,
    );
    // sent + 24h = 2026-07-17T00:00Z → restan 12h
    expect(t.reason).toBe('redeem_window');
    expect(Math.round(t.msRemaining / H)).toBe(12);
    expect(t.isExpired).toBe(false);
  });

  it('usa la ventana de sesión (24h desde activated_at) una vez activado', () => {
    const now = new Date('2026-07-16T13:00:00Z');
    const t = computeCodeTiming(
      { created_at: '2026-07-16T00:00:00Z', sent_at: '2026-07-16T00:00:00Z', activated_at: '2026-07-16T12:00:00Z', status: 'activated' },
      now,
    );
    expect(t.reason).toBe('session_window');
    expect(Math.round(t.msRemaining / H)).toBe(23);
  });

  it('la vida total de 5 días manda sobre las demás ventanas', () => {
    const now = new Date('2026-07-21T01:00:00Z'); // >5 días de created
    const t = computeCodeTiming(
      { created_at: '2026-07-16T00:00:00Z', sent_at: '2026-07-20T23:00:00Z', activated_at: null, status: 'sent' },
      now,
    );
    expect(t.reason).toBe('total_life');
    expect(t.isExpired).toBe(true);
  });
});

describe('canRedeem / canActivate', () => {
  it('solo permite canjear en status sent y vivo', () => {
    const base = { created_at: '2026-07-16T00:00:00Z', sent_at: '2026-07-16T00:00:00Z', activated_at: null };
    const now = new Date('2026-07-16T06:00:00Z');
    expect(canRedeem({ ...base, status: 'sent' }, now)).toBe(true);
    expect(canRedeem({ ...base, status: 'redeemed' }, now)).toBe(false);
  });

  it('solo permite activar en status redeemed y vivo', () => {
    const base = { created_at: '2026-07-16T00:00:00Z', sent_at: '2026-07-16T00:00:00Z', activated_at: null };
    const now = new Date('2026-07-16T06:00:00Z');
    expect(canActivate({ ...base, status: 'redeemed' }, now)).toBe(true);
    expect(canActivate({ ...base, status: 'sent' }, now)).toBe(false);
  });
});

describe('generateAccessCode', () => {
  it('genera formato TN-XXXX-XXXX sin caracteres ambiguos', () => {
    for (let i = 0; i < 50; i++) {
      const c = generateAccessCode();
      expect(c).toMatch(/^TN-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
    }
  });
});
