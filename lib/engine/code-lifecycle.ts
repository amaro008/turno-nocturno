// ============================================================================
// MOTOR — Ciclo de vida del código de acceso (puro TS, testeable).
// Regla de expiración efectiva (AUTH-USERS.md §Cálculo):
//   effective_expires_at = MIN(
//     created_at + 5 días,                       -- vida total
//     activated ? activated_at + 24h             -- ventana de sesión
//              : sent_at + 24h                    -- ventana de canje
//   )
// ============================================================================

import {
  AccessCode,
  CODE_REDEEM_WINDOW_HOURS,
  CODE_TOTAL_LIFE_DAYS,
  SESSION_WINDOW_HOURS,
} from '@/lib/domain';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export interface CodeTiming {
  effectiveExpiresAt: Date;
  isExpired: boolean;
  msRemaining: number;
  reason: 'redeem_window' | 'session_window' | 'total_life';
}

type CodeTimingInput = Pick<
  AccessCode,
  'created_at' | 'sent_at' | 'activated_at' | 'status'
>;

export function computeCodeTiming(code: CodeTimingInput, now: Date = new Date()): CodeTiming {
  const created = new Date(code.created_at).getTime();
  const totalLife = created + CODE_TOTAL_LIFE_DAYS * DAY;

  let windowExpiry: number;
  let reason: CodeTiming['reason'];

  if (code.activated_at) {
    windowExpiry = new Date(code.activated_at).getTime() + SESSION_WINDOW_HOURS * HOUR;
    reason = 'session_window';
  } else if (code.sent_at) {
    windowExpiry = new Date(code.sent_at).getTime() + CODE_REDEEM_WINDOW_HOURS * HOUR;
    reason = 'redeem_window';
  } else {
    // draft sin enviar: solo aplica la vida total
    windowExpiry = totalLife;
    reason = 'total_life';
  }

  let effective = windowExpiry;
  if (totalLife < effective) {
    effective = totalLife;
    reason = 'total_life';
  }

  const effectiveDate = new Date(effective);
  const msRemaining = effective - now.getTime();

  return {
    effectiveExpiresAt: effectiveDate,
    isExpired: msRemaining <= 0,
    msRemaining: Math.max(0, msRemaining),
    reason,
  };
}

/** ¿Puede canjearse ahora? (status sent + ventanas vivas) */
export function canRedeem(code: CodeTimingInput, now: Date = new Date()): boolean {
  if (code.status !== 'sent') return false;
  return !computeCodeTiming(code, now).isExpired;
}

/** ¿Puede activarse ahora? (status redeemed + ventanas vivas) */
export function canActivate(code: CodeTimingInput, now: Date = new Date()): boolean {
  if (code.status !== 'redeemed') return false;
  return !computeCodeTiming(code, now).isExpired;
}

/** Formato humano: "3h 42min" / "2d 4h" / "expirado" */
export function formatRemaining(msRemaining: number): string {
  if (msRemaining <= 0) return 'expirado';
  const totalMin = Math.floor(msRemaining / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
}

/** Genera un código legible `TN-XXXX-XXXX` (sin caracteres ambiguos). */
export function generateAccessCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I, O, 0, 1
  const pick = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `TN-${pick(4)}-${pick(4)}`;
}
