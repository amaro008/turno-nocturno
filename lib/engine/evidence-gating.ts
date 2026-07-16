// ============================================================================
// MOTOR — Gating de evidencia (puro TS). "El modelo propone, la BD dispone."
// Una evidencia es entregable si:
//   1. su scope es 'shared' del caso, O pertenece a la variante sorteada
//   2. el minuto transcurrido >= deliverable_from_minute
//   3. sus prerequisitos (unlocked_by) ya fueron desbloqueados
// ============================================================================

import { EvidenceItem } from '@/lib/domain';

export interface GatingContext {
  variantId: string | null;
  elapsedMin: number;
  unlockedCodes: string[]; // códigos de evidencia ya entregados/desbloqueados
}

export type GatingResult =
  | { ok: true; item: EvidenceItem }
  | { ok: false; reason: 'not_found' | 'wrong_variant' | 'too_early' | 'prereq_missing' };

export function canDeliver(
  code: string,
  catalog: EvidenceItem[],
  ctx: GatingContext,
): GatingResult {
  const item = catalog.find((e) => e.code === code);
  if (!item) return { ok: false, reason: 'not_found' };

  // 1. variante
  if (item.scope === 'variant' && item.variant_id !== ctx.variantId) {
    return { ok: false, reason: 'wrong_variant' };
  }

  // 2. minuto
  if (ctx.elapsedMin < item.deliverable_from_minute) {
    return { ok: false, reason: 'too_early' };
  }

  // 3. prerequisitos
  const unlocked = new Set(ctx.unlockedCodes);
  const missing = (item.unlocked_by ?? []).some((pre) => !unlocked.has(pre));
  if (missing) return { ok: false, reason: 'prereq_missing' };

  return { ok: true, item };
}

/** Evidencia visible en el catálogo para la sesión (shared + variante sorteada). */
export function visibleCatalog(
  catalog: EvidenceItem[],
  variantId: string | null,
): EvidenceItem[] {
  return catalog.filter((e) => e.scope === 'shared' || e.variant_id === variantId);
}
