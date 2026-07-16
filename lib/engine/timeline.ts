// ============================================================================
// MOTOR — Eventos temporales (puro TS, idempotente).
// El scheduler del cliente hace polling; este módulo decide qué disparar.
// La idempotencia real la garantiza el UNIQUE constraint en session_events;
// aquí solo calculamos qué eventos están vencidos y aún no ejecutados.
// ============================================================================

import { TimelineEvent } from '@/lib/domain';

/** Minutos transcurridos desde la activación de la sesión. */
export function minutesElapsed(activatedAt: string, now: Date = new Date()): number {
  const start = new Date(activatedAt).getTime();
  return Math.floor((now.getTime() - start) / 60000);
}

/** Segundos restantes hasta el límite de tiempo del caso (nunca negativo). */
export function secondsRemaining(
  activatedAt: string,
  timeLimitMin: number,
  now: Date = new Date(),
): number {
  const deadline = new Date(activatedAt).getTime() + timeLimitMin * 60000;
  return Math.max(0, Math.floor((deadline - now.getTime()) / 1000));
}

/**
 * Filtra los eventos que:
 *  - corresponden a la variante sorteada (o a todas),
 *  - ya vencieron según los minutos transcurridos,
 *  - y NO figuran en `firedIds` (ya ejecutados).
 */
export function dueEvents(
  timeline: TimelineEvent[],
  opts: { elapsedMin: number; variantCode: string | null; firedIds: string[] },
): TimelineEvent[] {
  const fired = new Set(opts.firedIds);
  return timeline
    .filter((e) => e.variant_scope === null || e.variant_scope === opts.variantCode)
    .filter((e) => e.minute <= opts.elapsedMin)
    .filter((e) => !fired.has(e.id))
    .sort((a, b) => a.minute - b.minute);
}
