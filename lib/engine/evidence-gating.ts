// ============================================================================
// MOTOR — Disponibilidad de evidencia (puro TS). Modelo F1:
// una pieza está ABIERTA para la sesión si:
//   0. es visible para la variante (shared, o su variant_id coincide), Y
//   1. `initial` (abierta desde el minuto 0), O
//   2. tiene `unlocked_at_minute` y ya transcurrió, O
//   3. su `unlocked_by_event_id` (evento del Comandante) ya se disparó, O
//   4. fue desbloqueada manualmente (código impreso / herramienta).
// "El modelo propone, la BD dispone."
// ============================================================================

import type { EvidenceBase } from '@/lib/domain';

export interface GatingContext {
  variantId: string | null;
  elapsedMin: number;
  firedEventIds?: string[]; // ids de case_timeline ya disparados
  unlockedCodes?: string[]; // códigos abiertos manualmente
}

export type OpenReason = 'initial' | 'time' | 'event' | 'manual';

/** Evidencia visible para la variante (shared + variante sorteada). */
export function visibleForVariant(catalog: EvidenceBase[], variantId: string | null): EvidenceBase[] {
  return catalog.filter((e) => e.scope === 'shared' || e.variant_id === variantId);
}

/** ¿Está abierta esta pieza para la sesión? Devuelve el motivo o null. */
export function openReason(item: EvidenceBase, ctx: GatingContext): OpenReason | null {
  if (item.scope === 'variant' && item.variant_id !== ctx.variantId) return null;
  if (item.initial) return 'initial';
  if (item.unlocked_at_minute != null && ctx.elapsedMin >= item.unlocked_at_minute) return 'time';
  if (item.unlocked_by_event_id && (ctx.firedEventIds ?? []).includes(item.unlocked_by_event_id)) return 'event';
  if ((ctx.unlockedCodes ?? []).includes(item.code)) return 'manual';
  return null;
}

export function isOpen(item: EvidenceBase, ctx: GatingContext): boolean {
  return openReason(item, ctx) !== null;
}

export type GatingResult =
  | { ok: true; item: EvidenceBase }
  | { ok: false; reason: 'not_found' | 'wrong_variant' | 'too_early' };

/**
 * ¿Puede abrirse esta pieza AHORA por petición (código/herramienta)?
 * Con `viaEvent` se omite la compuerta de tiempo (la dispara el Comandante).
 */
export function canOpen(
  code: string,
  catalog: EvidenceBase[],
  ctx: GatingContext,
  viaEvent = false,
): GatingResult {
  const item = catalog.find((e) => e.code === code);
  if (!item) return { ok: false, reason: 'not_found' };
  if (item.scope === 'variant' && item.variant_id !== ctx.variantId) {
    return { ok: false, reason: 'wrong_variant' };
  }
  if (viaEvent || item.initial) return { ok: true, item };
  if (item.unlocked_at_minute != null && ctx.elapsedMin >= item.unlocked_at_minute) return { ok: true, item };
  if (item.unlocked_by_event_id) return { ok: false, reason: 'too_early' }; // solo por evento
  if (item.unlocked_at_minute != null) return { ok: false, reason: 'too_early' };
  return { ok: true, item }; // sin condición explícita → disponible a petición
}
