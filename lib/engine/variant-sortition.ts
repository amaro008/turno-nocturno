// ============================================================================
// MOTOR — Sorteo uniforme de variante entre las activas (puro TS).
// ============================================================================

import { Variant } from '@/lib/domain';

/** Devuelve una variante activa al azar (uniforme). Lanza si no hay ninguna. */
export function sortitionVariant(
  variants: Pick<Variant, 'id' | 'active'>[],
  rng: () => number = Math.random,
): string {
  const active = variants.filter((v) => v.active);
  if (active.length === 0) {
    throw new Error('No hay variantes activas para sortear');
  }
  const idx = Math.floor(rng() * active.length);
  return active[idx].id;
}
