'use client';

import type { Case, SuspectWithVariants, EvidenceFull, Variant } from '@/lib/domain';
import { validateCase } from '@/lib/domain/case-validation';

/** Banner de estado del caso: stats + advertencias + bloqueos de publicación. */
export default function StatusBanner({
  caseRow,
  suspects,
  evidence,
  variants,
  timelineCount,
}: {
  caseRow: Case;
  suspects: SuspectWithVariants[];
  evidence: EvidenceFull[];
  variants: Variant[];
  timelineCount: number;
}) {
  const { stats, blockers, warnings } = validateCase({
    caseRow,
    suspects,
    evidence,
    variants,
    timelineCount,
  });

  return (
    <div className={'status-banner ' + (caseRow.active ? 'on' : 'draft')}>
      <div className="sb-row">
        <span className={'sb-state ' + (caseRow.active ? 'on' : 'draft')}>
          {caseRow.active ? '● ACTIVO' : '○ BORRADOR'}
        </span>
        <span className="sb-stat mono">{stats.evidenceTotal} evidencias · {stats.evidenceInitial} iniciales · {stats.evidenceReleased} con liberación</span>
        <span className="sb-stat mono">{stats.suspects} sospechosos{stats.victims ? ` · ${stats.victims} víctima` : ''}</span>
        <span className="sb-stat mono">{stats.variantsActive} variantes activas · culpables {stats.culpritsAssigned ? '✓' : '✗'}</span>
        <span className="sb-stat mono">{stats.timelineEvents} eventos</span>
      </div>

      {blockers.length > 0 && (
        <div className="sb-block">
          <b>No se puede publicar:</b>
          <ul>{blockers.map((b, i) => <li key={i}>{b}</li>)}</ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="sb-warn">
          <b>Advertencias:</b>
          <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}
      {blockers.length === 0 && warnings.length === 0 && (
        <div className="sb-ok">Sin bloqueos ni advertencias. El caso puede publicarse.</div>
      )}
    </div>
  );
}
